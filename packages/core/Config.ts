import * as importmap from '../../dep/importmap.ts';
import * as path from '../../dep/std/path.ts';

import { esbuildBundler, ScriptLoader } from '../loader_script/mod.ts';

import * as log from '../log/mod.ts';
import { Loader } from './loader.ts';
import { Page } from './Page.ts';
import { FilesystemPersistence, Persistence } from './Persistence.ts';

// TODO(PaulBlanche): add config validator

export type Config = {
    /** The URL of the module containing the config module (usually
     * `import.meta.url`). All relative paths will be resolved relatively to
     * this */
    self: URL;
    /** The root of the project. Defaults to `.` (the directory of the config
     * module) */
    root?: URL;
    /** The url of an import map */
    importMap?: string;
    /** The list of all loaders */
    loaders?: Loader<unknown>[];
    /** the output directory (where frugal will setup its cache and public
     * directory) */
    outputDir: string;
    /** The list of registered pages */
    pages: Page[];
    /** An optional persistence layer for page cache, if you run frugal in a
     * distributed environment. Default on Filesystem */
    pagePersistence?: Persistence;
    /** An optional persistence layer for frugal cache, if you build/load frugal
     * in a distributed environment. Default on Filesystem */
    cachePersistence?: Persistence;
    /** the loggers config */
    logging?: log.Config;
};

export const LOGGERS = [
    'frugal:Cache',
    'frugal:DependencyGraph',
    'frugal:Frugal',
    'frugal:FrugalBuilder',
    'frugal:LoaderContext',
    'frugal:PageBuilder',
    'frugal:PageGenerator',
    'frugal:PageRefresher',
    'frugal:dependency_graph',
    'frugal:loader:jsx_svg',
    'frugal:loader:esbuildBundler',
    'frugal:loader:ScriptLoader',
    'frugal:loader:StyleLoader',
];

export function loggers(level: log.Config['loggers'][string]) {
    return LOGGERS.reduce<log.Config['loggers']>((loggers, logger) => {
        loggers[logger] = level;
        return loggers;
    }, {});
}

export const OFF_LOGGER_CONFIG: log.Config = {
    type: 'human',
    loggers: loggers('NOTSET'),
};

export const DEFAULT_LOGGER_CONFIG: log.Config = {
    type: 'human',
    loggers: loggers('INFO'),
};

export const DEBUG_LOGGER_CONFIG: log.Config = {
    type: 'human',
    loggers: loggers('INFO'),
};

await log.setup(DEFAULT_LOGGER_CONFIG);

const FS_PERSISTENCE = new FilesystemPersistence();

/**
 * A config object, wrapping the actual config with convinence methods.
 */
export class CleanConfig {
    #watch?: boolean;
    #config: Config;
    #importMap: importmap.ImportMap;
    #importMapURL?: URL;

    /**
     * Load the given config
     */
    static async load(
        config: Config,
        watch?: boolean,
    ) {
        const cleanConfig = new CleanConfig(
            config,
            await loadImportMap(config),
            config.importMap,
            watch,
        );

        return cleanConfig;
    }

    constructor(
        config: Config,
        importMap: importmap.ImportMap,
        importMapFile?: string,
        watch?: boolean,
    ) {
        this.#watch = watch;

        if (!watch) {
            this.#config = config;
        } else {
            // inject a script loader in the config to be able to inject the
            // livereload client in the pages
            const scriptLoader = new ScriptLoader({
                bundles: [{
                    name: 'inject-watch-script',
                    test: (url) => {
                        return /injected-watch-script\.ts$/.test(
                            url.toString(),
                        );
                    },
                }],
                bundler: esbuildBundler({
                    format: 'esm',
                    minify: false,
                    splitting: false,
                    sourcemap: true,
                }),
            });

            scriptLoader.name = 'inject-watch-script';

            this.#config = {
                ...config,
                loaders: [scriptLoader, ...config.loaders ?? []],
            };
        }

        this.#importMap = importmap.resolveImportMap(importMap, this.root);
        this.#importMapURL = importMapFile
            ? new URL(importMapFile, this.root)
            : undefined;
    }

    /**
     * Get a logger config object (with automatic fallback on default)
     */
    get loggingConfig() {
        const config = this.#config.logging;
        return {
            type: config?.type ?? DEFAULT_LOGGER_CONFIG.type,
            loggers: {
                ...DEFAULT_LOGGER_CONFIG.loggers,
                ...config?.loggers,
            },
        };
    }

    /**
     * Get the page persistence layer (with automatic fallbakc on Filesystem)
     */
    get pagePersistence() {
        return this.#config.pagePersistence ?? FS_PERSISTENCE;
    }

    /**
     * Get the cache persistence layer (with automatic fallbakc on Filesystem)
     */
    get cachePersistence() {
        return this.#config.cachePersistence ?? FS_PERSISTENCE;
    }

    /**
     * Return the root of the project (either `self` or `root` relative to
     * `self` if `root` is set)
     */
    get root() {
        return configRoot(this.#config);
    }

    get pages() {
        return this.#config.pages;
    }

    get self() {
        return this.#config.self;
    }

    get loaders() {
        return this.#config.loaders ?? [];
    }

    /**
     * Return the resolved outputDir
     */
    get outputDir() {
        return path.resolve(this.root.pathname, this.#config.outputDir);
    }

    /**
     * Return the resolved public directory (a `'public'` directory inside `outputDir`)
     */
    get publicDir() {
        return path.resolve(this.outputDir, 'public');
    }

    /**
     * Return the resolved cache directory (a `'.cache'` directory inside `outputDir`)
     */
    get cacheDir() {
        return path.resolve(this.outputDir, '.cache');
    }

    get watch() {
        return this.#watch;
    }

    get importMapURL() {
        return this.#importMapURL;
    }

    /**
     * Return a resolve method generated from the config import map.
     */
    get resolve() {
        if (this.#importMap === undefined) return undefined;
        return (specifier: string, referer: URL) => {
            return new URL(
                importmap.resolveModuleSpecifier(
                    specifier,
                    this.#importMap,
                    referer,
                ),
            );
        };
    }
}

async function loadImportMap(config: Config): Promise<importmap.ImportMap> {
    if (config.importMap === undefined) {
        return {};
    }

    const importMapUrl = new URL(
        config.importMap,
        configRoot(config),
    );

    const source = await Deno.readTextFile(importMapUrl);

    return importmap.resolveImportMap(JSON.parse(source), importMapUrl);
}

function configRoot(config: Config) {
    return new URL(config.root ?? '.', config.self);
}
