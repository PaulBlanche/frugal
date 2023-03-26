import * as esbuild from '../../dep/esbuild.ts';
import * as importmap from '../../dep/importmap.ts';
import * as path from '../../dep/std/path.ts';
import { log } from '../log.ts';
import { Loader } from '../resolve/shared.ts';

const DENO_RESOLVE_ALREADY_RESOLVED = Symbol('deno-resolve-already-resolved');

type EsbuildLoaderConfig = {
    nodeModulesDir: URL;
    importMap?: Promise<importmap.ImportMap>;
};

export class EsbuildLoader {
    #config: EsbuildLoaderConfig;
    #loader: Loader;
    #nodeModuleSpecifiers: Set<string>;

    constructor(config: EsbuildLoaderConfig, loader: Loader) {
        this.#config = config;
        this.#loader = loader;
        this.#nodeModuleSpecifiers = new Set<string>([]);
    }

    async resolve(
        resolve: esbuild.PluginBuild['resolve'],
        args: esbuild.OnResolveArgs,
    ): Promise<esbuild.OnResolveResult | undefined> {
        if (
            args.pluginData?.[DENO_RESOLVE_ALREADY_RESOLVED] ||
            this.#nodeModuleSpecifiers.has(args.importer)
        ) {
            return {};
        }

        const resolveDir = args.resolveDir ? `${path.toFileUrl(args.resolveDir).href}/` : '';

        const referrer = args.importer ? `${args.namespace}:${args.importer}` : resolveDir;

        const importMap = await this.#config.importMap;
        const resolved = importMap
            ? new URL(importmap.resolveModuleSpecifier(
                args.path,
                importMap,
                new URL(referrer),
            ))
            : new URL(args.path, referrer);

        const res = await this.#loader.resolve(resolved);

        switch (res.kind) {
            case 'esm':
                if (res.specifier.protocol === 'file:') {
                    const resolvedPath = path.fromFileUrl(resolved);
                    return {
                        path: resolvedPath,
                        namespace: 'file',
                    };
                } else {
                    const path = resolved.href.slice(
                        res.specifier.protocol.length,
                    );
                    return {
                        path,
                        namespace: res.specifier.protocol.slice(
                            0,
                            -1,
                        ),
                    };
                }
            case 'npm': {
                const modulePath = `${res.packageName}${res.path ?? ''}`;
                const result = await resolve(modulePath, {
                    kind: args.kind,
                    resolveDir: path.fromFileUrl(this.#config.nodeModulesDir),
                    pluginData: {
                        [DENO_RESOLVE_ALREADY_RESOLVED]: true,
                    },
                });

                if (result.errors.length > 0) {
                    return { errors: result.errors };
                }

                this.#nodeModuleSpecifiers.add(result.path);
                return result;
            }
            case 'node':
                return { path: res.path, external: true };
        }
    }

    async load(args: esbuild.OnLoadArgs) {
        try {
            const specifier = getLoadSpecifier(args);
            const loaded = await this.#loader.loadEsm(specifier);
            return { specifier, loaded };
        } catch (error) {
            log(error, { scope: 'denoResolve' });
            throw error;
        }
    }
}

export function getLoadSpecifier(args: esbuild.OnLoadArgs) {
    if (args.namespace === 'file') {
        return path.toFileUrl(args.path).href;
    } else {
        return `${args.namespace}:${args.path}`;
    }
}
