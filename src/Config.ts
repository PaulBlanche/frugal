import * as path from '../dep/std/path.ts';
import * as esbuild from '../dep/esbuild.ts';
import * as XXH64 from '../dep/xxhash.ts';
import * as graph from '../dep/deno_graph.ts';
import * as importmap from '../dep/importmap.ts';

import { Budget, BudgetConfig } from './build/Budget.ts';
import { ResponseCache } from './page/ResponseCache.ts';
import { FilesystemPersistence } from './persistence/FilesystemPersistence.ts';
import { Persistence } from './persistence/Persistence.ts';
import { Plugin, PluginInstance } from './Plugin.ts';
import * as log from './log.ts';
import { Loader } from './resolve/Loader.ts';
import { FrugalServerConfig, ServerConfig } from './server/Config.ts';
import { EsbuildLoader } from './build/EsbuildLoader.ts';

export type FrugalConfig = {
    pages: string[];
    self: string;
    outdir?: string;
    buildPersistence?: Persistence;
    runtimePersistence?: Persistence;
    plugins?: Plugin[];
    nodeModuleDir?: string;
    esbuild?:
        & Pick<
            esbuild.BuildOptions,
            | 'splitting'
            | 'preserveSymlinks'
            | 'external'
            | 'packages'
            | 'alias'
            | 'loader'
            | 'resolveExtensions'
            | 'mainFields'
            | 'conditions'
            | 'publicPath'
            | 'entryNames' // only for assets
            | 'chunkNames' // only for assets
            | 'assetNames' // only for assets
            | 'inject'
            | 'banner'
            | 'footer'
            | 'stdin'
            | 'plugins'
            | 'nodePaths'
            | 'sourcemap'
            | 'legalComments'
            | 'sourceRoot'
            | 'sourcesContent'
            | 'mangleProps'
            | 'reserveProps'
            | 'mangleQuoted'
            | 'mangleCache'
            | 'drop'
            | 'minify'
            | 'minifyWhitespace'
            | 'minifyIdentifiers'
            | 'minifySyntax'
            | 'charset'
            | 'treeShaking'
            | 'ignoreAnnotations'
            | 'define'
            | 'pure'
            | 'keepNames'
        >
        & {
            target?: 'es6-modules' | 'esnext';
        };
    importMap?: string;
    budget?: BudgetConfig;
    log?: Partial<log.LogConfig>;
    livereload?: {
        port?: number;
    };
    server?: FrugalServerConfig;
};

export class Config {
    #config: FrugalConfig;
    #pluginInstances: PluginInstance[];
    #budget: Budget;
    #hash?: Promise<string>;
    #loader: EsbuildLoader;
    #importMap?: Promise<importmap.ImportMap>;
    #serverConfig: ServerConfig;
    #excludeAsset: Record<string, RegExp[]>;
    #includeAsset: Record<string, RegExp[]>;

    constructor(config: FrugalConfig) {
        this.#config = config;
        config.log && log.config(config.log);

        const importMapURL = config.importMap
            ? new URL(config.importMap, this.#config.self)
            : undefined;

        if (importMapURL) {
            this.#importMap = loadImportMap(importMapURL);
        }

        this.#budget = new Budget(config.budget);
        this.#loader = new EsbuildLoader({
            importMap: this.#importMap,
            nodeModulesDir: this.nodeModulesDir,
        }, new Loader({ importMapURL }));

        this.#pluginInstances = [];
        this.#includeAsset = {};
        this.#excludeAsset = {};

        for (const plugin of (this.#config.plugins ?? [])) {
            const instance: PluginInstance = {
                name: plugin.name,
                server: [],
                asset: [],
            };

            plugin.create({
                config: this,
                onBuildAssets: (buildAssets) => {
                    if (instance.buildAssets !== undefined) {
                        throw Error('only on onBuildAssets per plugin');
                    }
                    instance.buildAssets = buildAssets;
                },
                excludeAsset: ({ type, filter }) => {
                    this.#excludeAsset[type] = this.#excludeAsset[type] ?? [];
                    this.#excludeAsset[type].push(filter);
                },
                includeAsset: ({ type, filter }) => {
                    this.#includeAsset[type] = this.#includeAsset[type] ?? [];
                    this.#includeAsset[type].push(filter);
                },
                register({ type, setup }) {
                    instance[type].push({
                        name: `${plugin.name}:${type}`,
                        setup(build) {
                            setup({
                                ...build,
                                onDispose(callback) {
                                    build.onDispose(() => {
                                        try {
                                            callback();
                                        } catch (e) {
                                            log.log(e);
                                            throw e;
                                        }
                                    });
                                },
                                onEnd(callback) {
                                    build.onEnd(async (args) => {
                                        try {
                                            return await callback(args);
                                        } catch (e) {
                                            log.log(e);
                                            throw e;
                                        }
                                    });
                                },
                                onLoad(options, callback) {
                                    build.onLoad(options, async (args) => {
                                        try {
                                            return await callback(args);
                                        } catch (e) {
                                            log.log(e);
                                            throw e;
                                        }
                                    });
                                },
                                onResolve(options, callback) {
                                    build.onResolve(options, async (args) => {
                                        try {
                                            return await callback(args);
                                        } catch (e) {
                                            log.log(e);
                                            throw e;
                                        }
                                    });
                                },
                                onStart(callback) {
                                    build.onStart(async () => {
                                        try {
                                            return await callback();
                                        } catch (e) {
                                            log.log(e);
                                            throw e;
                                        }
                                    });
                                },
                            });
                        },
                    });
                },
            });

            this.#pluginInstances.push(instance);
        }

        this.#serverConfig = new ServerConfig(config.server ?? {}, this);
    }

    async validate() {
        for (const page of this.pages) {
            try {
                await Deno.stat(page);
            } catch (cause) {
                const error = new Error(
                    `file "./${this.relative(page.href)}" is not accessible`,
                    { cause },
                );
                log.log(error, { scope: 'Config' });
            }
        }
    }

    relative(url: string | URL) {
        const relativePath = `${
            path.relative(
                path.fromFileUrl(this.root),
                path.fromFileUrl(url),
            )
        }`;
        if (!relativePath.startsWith('.')) {
            return `./${relativePath}`;
        }
        return relativePath;
    }

    isAsset(type: string, path: string) {
        let isAsset = false;

        const includes = this.#includeAsset[type] ?? [];
        for (const include of includes) {
            isAsset = isAsset || include.test(path);
        }

        const excludes = this.#excludeAsset[type] ?? [];
        for (const exclude of excludes) {
            isAsset = isAsset && !exclude.test(path);
        }

        return isAsset;
    }

    get excludeAsset() {
        return this.#excludeAsset;
    }

    get nodeModulesDir() {
        return new URL(this.#config.nodeModuleDir ?? 'node_modules/', this.self);
    }

    get server(): ServerConfig {
        return this.#serverConfig;
    }

    get loader() {
        return this.#loader;
    }

    get hash() {
        if (this.#hash === undefined) {
            this.#hash = hash(this.self, this.importMap);
        }
        return this.#hash;
    }

    setHash(hash?: string) {
        this.#hash = hash ? Promise.resolve(hash) : undefined;
    }

    get importMap() {
        return this.#importMap;
    }

    get pages() {
        return this.#config.pages.map((page) => new URL(page, this.self));
    }

    get self() {
        return new URL(this.#config.self);
    }

    get root() {
        return new URL('.', this.#config.self);
    }

    get outdir() {
        return new URL(this.#config.outdir ?? 'dist/', this.#config.self);
    }

    get cachedir() {
        return new URL('.cache/', this.outdir);
    }

    get clidir() {
        return new URL('cli/', this.root);
    }

    get builddir() {
        return new URL('build/', this.cachedir);
    }

    get runtimedir() {
        return new URL('runtime/', this.cachedir);
    }

    get publicdir() {
        return new URL('public/', this.outdir);
    }

    get buildPersistence() {
        return this.#config.buildPersistence ??
            new FilesystemPersistence(new URL('build/', this.cachedir));
    }

    get runtimePersistence() {
        return this.#config.runtimePersistence ??
            new FilesystemPersistence(new URL('runtime/', this.cachedir));
    }

    get budget() {
        return this.#budget;
    }

    get plugins() {
        return this.#pluginInstances;
    }

    get esbuildOptions() {
        return this.#config.esbuild;
    }

    get isDevMode() {
        return Deno.env.get('FRUGAL_MODE') === 'dev';
    }

    async responseCache(mode: 'build' | 'runtime') {
        return await ResponseCache.load(this, mode);
    }
}

async function hash(
    self: URL,
    _importMap: Promise<importmap.ImportMap> | undefined,
): Promise<string> {
    const importMap = await _importMap;
    const { modules } = await graph.createGraph(self.href, {
        resolve: (specifier, referrer) => {
            const resolved = importMap
                ? new URL(importmap.resolveModuleSpecifier(
                    specifier,
                    importMap,
                    new URL(referrer),
                ))
                : new URL(specifier, referrer);

            return resolved.href;
        },
        load: async (specifier) => {
            const url = new URL(specifier);
            // dont bother loading http modules, url should be unique anyway
            if (url.protocol.startsWith('http')) {
                return {
                    kind: 'module',
                    specifier,
                    content: `//${specifier}`,
                };
            }
            return await graph.load(specifier);
        },
    });

    const hash = await XXH64.create();

    for (const module of modules) {
        hash.update(await getModuleContent(new URL(module.specifier)));
    }

    return hash.digest('hex') as string;
}

const ENCODER = new TextEncoder();

async function getModuleContent(url: URL) {
    if (url.protocol === 'file:') {
        return await Deno.readFile(url);
    }
    return ENCODER.encode(url.href);
}

async function loadImportMap(importMapURL: URL) {
    const response = await fetch(importMapURL.href);
    const importMapData = await response.text();
    return importmap.resolveImportMap(
        JSON.parse(importMapData),
        importMapURL,
    );
}
