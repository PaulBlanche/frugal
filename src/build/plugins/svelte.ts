import * as path from '../../../dep/std/path.ts';
import * as esbuild from '../../../dep/esbuild.ts';

import { Plugin, RegisteredPlugin } from '../../Plugin.ts';
import { Config } from '../../Config.ts';
import { log } from '../../log.ts';

import { compile } from 'svelte/compiler';

type ScriptOptions = {
    filter: RegExp;
};

type SourceMap = {
    toString(): string;
    toUrl(): string;
};

type Warning = ReturnType<typeof compile>['warnings'][number];

type ServerCompile = {
    css: { code: string; map: SourceMap };
    js: { code: string; map: SourceMap };
    warnings: Warning[];
};

export function svelte(
    { filter = /\.svelte$/ }: Partial<ScriptOptions> = {},
): Plugin {
    const cssCache = new Map<string, string>();

    return {
        name: 'svelte',
        create(build) {
            const config = build.config;

            build.register({
                type: 'server',
                setup(build) {
                    build.onResolve({ filter: /\.css$/ }, (args) => {
                        if (cssCache.has(args.path)) {
                            return { path: args.path, namespace: 'virtual' };
                        }
                    });

                    build.onLoad({ filter: /\.css$/, namespace: 'virtual' }, (args) => {
                        const path = args.path.replace('virtual:', '');
                        if (cssCache.has(path)) {
                            return { contents: cssCache.get(path), loader: 'empty' };
                        }
                    });

                    build.onLoad({ filter }, async (args) => {
                        const { specifier, entrypoint, loaded } = await loadFile(args);

                        const { css, js, warnings } = compileServer(loaded.contents);

                        if (css.code) {
                            const identifier = `${entrypoint}.css`;
                            cssCache.set(identifier, css.code);

                            js.code = `${js.code}\nimport "${identifier}";`;
                        }

                        return {
                            ...loaded,
                            contents: js.code,
                            loader: 'js',
                            watchFiles: [specifier],
                            warnings: warnings.map(convertMessage),
                        };
                    });
                },
            });

            build.register({
                type: 'asset',
                setup(build) {
                    build.onResolve({ filter: /\.css$/ }, (args) => {
                        const path = args.path.replace('virtual:', '');
                        if (cssCache.has(path)) {
                            return { path, namespace: 'virtual' };
                        }
                    });

                    build.onLoad({ filter: /\.css$/, namespace: 'virtual' }, (args) => {
                        const path = args.path.replace('virtual:', '');
                        console.log(args.path, path);
                        if (cssCache.has(path)) {
                            return { contents: cssCache.get(path), loader: 'css' };
                        }
                    });

                    build.onLoad({ filter }, async (args) => {
                        const { specifier, loaded } = await loadFile(args);

                        const { js, warnings } = compileAsset(loaded.contents);

                        return {
                            ...loaded,
                            contents: js.code,
                            loader: 'js',
                            watchFiles: [specifier],
                            warnings: warnings.map(convertMessage),
                        };
                    });
                },
            });

            async function loadFile(args: esbuild.OnLoadArgs) {
                const { specifier, loaded } = await config.loader.load(
                    args,
                );

                const entrypoint = build.config.relative(specifier);
                log(
                    `found svelte entrypoint "${entrypoint}"`,
                    {
                        kind: 'debug',
                        scope: 'plugin:svelte',
                        extra: JSON.stringify(args),
                    },
                );

                return { specifier, entrypoint, loaded };
            }
        },
    };
}

function compileServer(contents: Uint8Array | string): ServerCompile {
    const source = typeof contents === 'string' ? contents : new TextDecoder().decode(contents);

    const compiled = compile(source, {
        generate: 'ssr',
        preserveComments: true,
    });

    compiled.js.code = compiled.js.code.replaceAll(
        'svelte/internal',
        'npm:svelte/internal',
    );

    return compiled;
}

function compileAsset(contents: Uint8Array | string): ServerCompile {
    const source = typeof contents === 'string' ? contents : new TextDecoder().decode(contents);

    const compiled = compile(source, {
        generate: 'dom',
        hydratable: true,
        preserveComments: true,
    });

    compiled.js.code = compiled.js.code.replaceAll(
        'svelte/internal',
        'npm:svelte/internal',
    );

    return compiled;
}

function convertMessage({ message, start, end, filename, frame }: Warning) {
    return {
        text: message,
        location: start &&
            end && {
            file: filename,
            line: start.line,
            column: start.column,
            length: start.line === end.line ? end.column - start.column : 0,
            lineText: frame,
        },
    };
}

type ServerSvelteOptions = {
    filter: RegExp;
    config: Config;
};

type AssetSvelteOptions = {
    filter: RegExp;
    config: Config;
};
function assetSvelte({ filter, config }: AssetSvelteOptions): RegisteredPlugin {
    return {
        type: 'asset',
        setup(build) {
            build.onLoad({ filter }, async (args) => {
                const { specifier, loaded } = await config.loader.load(args);

                const entrypoint = path.relative(
                    path.fromFileUrl(new URL('.', config.self)),
                    path.fromFileUrl(new URL(specifier)),
                );
                log(
                    `found svelte entrypoint "${entrypoint}"`,
                    {
                        kind: 'debug',
                        scope: 'asset-svelte',
                    },
                );

                const source = typeof loaded.contents === 'string'
                    ? loaded.contents
                    : new TextDecoder().decode(loaded.contents);
                const { js } = compile(source, {
                    generate: 'dom',
                    hydratable: true,
                    preserveComments: true,
                });

                js.code = js.code.replaceAll(
                    'svelte/internal',
                    'npm:svelte/internal',
                );

                const contents = `${js.code}`;

                return {
                    ...loaded,
                    contents,
                    loader: 'js',
                };
            });
        },
    };
}
