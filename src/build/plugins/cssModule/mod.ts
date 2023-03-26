import * as lightning from '../../../../dep/lightningcss.ts';
import * as buffer from '../../../../dep/std/node/buffer.ts';

import { Plugin } from '../../../Plugin.ts';
import { log } from '../../../log.ts';
import * as utils from '../utils.ts';
import { Config } from '../../../Config.ts';

type CssModuleOptions = {
    filter: RegExp;
};

const TEXT_ENCODER = new TextEncoder();

export function cssModule(
    { filter = /\.module\.css$/ }: Partial<CssModuleOptions> = {},
): Plugin {
    const generatedCssCache = new Map();
    const cssModuleCache = new Map<string, string>();

    return {
        name: 'cssModule',
        create(build) {
            const config = build.config;

            build.excludeAsset({ type: 'css', filter });

            build.register({
                type: 'server',
                setup(build) {
                    build.onResolve({ filter: /css-module-utils/ }, (args) => {
                        return { path: args.path, namespace: 'virtual' };
                    });

                    build.onLoad(
                        { filter: /css-module-utils/, namespace: 'virtual' },
                        async (args) => {
                            return {
                                contents: await Deno.readFile(
                                    new URL('./cssModuleUtils.ts', import.meta.url),
                                ),
                                loader: 'ts',
                            };
                        },
                    );

                    build.onResolve({ filter: /\.css$/ }, (args) => {
                        if (generatedCssCache.has(args.path)) {
                            return { path: args.path, namespace: 'virtual' };
                        }
                    });

                    build.onLoad({ filter: /\.css$/, namespace: 'virtual' }, (args) => {
                        if (generatedCssCache.has(args.path)) {
                            return {
                                contents: '',
                                loader: 'empty',
                            };
                        }
                    });

                    build.onLoad({ filter }, async (args) => {
                        const { specifier, loaded } = await config.loader.load(args);

                        log(`found css module entrypoint "${utils.name(specifier, config)}"`, {
                            kind: 'debug',
                            scope: 'plugin:cssModule',
                        });

                        const transformed = transformCssModule(
                            config,
                            specifier,
                            loaded.contents,
                        );

                        return {
                            ...loaded,
                            contents: transformed,
                            loader: 'js',
                        };
                    });
                },
            });

            build.register({
                type: 'asset',
                setup(build) {
                    build.onResolve({ filter: /css-module-utils/ }, (args) => {
                        return { path: args.path, namespace: 'virtual' };
                    });

                    build.onLoad(
                        { filter: /css-module-utils/, namespace: 'virtual' },
                        async (args) => {
                            return {
                                contents: await Deno.readFile(
                                    new URL('./cssModuleUtils.ts', import.meta.url),
                                ),
                                loader: 'ts',
                            };
                        },
                    );

                    build.onResolve({ filter: /\.css$/ }, (args) => {
                        const path = args.path.replace(/^virtual:/, '');
                        if (generatedCssCache.has(path)) {
                            return { path, namespace: 'virtual' };
                        }
                    });

                    build.onLoad({ filter: /\.css$/, namespace: 'virtual' }, (args) => {
                        if (generatedCssCache.has(args.path)) {
                            return {
                                contents: generatedCssCache.get(
                                    args.path,
                                )!,
                                loader: 'css',
                            };
                        }
                    });

                    build.onLoad({ filter }, async (args) => {
                        const { specifier, loaded } = await config.loader.load(args);
                        log(`found css module entrypoint "${utils.name(specifier, config)}"`, {
                            kind: 'debug',
                            scope: 'plugin:cssModule',
                        });

                        return { ...loaded, contents: cssModuleCache.get(specifier), loader: 'js' };
                    });
                },
            });
        },
    };

    function transformCssModule(
        config: Config,
        specifier: string,
        cssCode: Uint8Array | string,
    ) {
        const name = utils.name(specifier, config);
        const { code, exports = {} } = lightning.transform({
            filename: name,
            code: buffer.Buffer.from(
                typeof cssCode === 'string' ? TEXT_ENCODER.encode(cssCode) : cssCode,
            ),
            cssModules: true,
        });

        const generatedCssSpecifier = `${name}.css`;
        generatedCssCache.set(generatedCssSpecifier, code);

        const cssModuleContent = [`import "${generatedCssSpecifier}";`];

        if (config.isDevMode) {
            cssModuleContent.push(
                `import { flatten, wrap } from "css-module-utils";`,
            );
        }

        const reverseLookup: Record<string, string | undefined> = {};
        const imports: Record<string, string[]> = {};
        for (const exportName in exports) {
            const exported = exports[exportName];
            reverseLookup[exported.name] = exportName;
            for (const compose of exported.composes) {
                if (compose.type === 'dependency') {
                    imports[compose.specifier] = imports[compose.specifier] ||
                        [];
                    imports[compose.specifier].push(id(compose.name));
                }
            }
        }

        for (const importSpecifier in imports) {
            const resolvedSpecifier = new URL(importSpecifier, specifier).href;
            const imported = imports[importSpecifier].join(', ');
            cssModuleContent.push(
                `import { ${imported} } from "${resolvedSpecifier}";`,
            );
        }

        cssModuleContent.push(`const moduleName = "${name}"`);
        cssModuleContent.push(`const names = {}`);

        type CssModuleExport = {
            code: string;
            name: string;
        };

        const cssModuleExports: Record<string, CssModuleExport> = {};
        const dependencyLinks: Record<string, string[]> = {};
        const parentLinks: Record<string, string[]> = {};

        for (const exportName in exports) {
            dependencyLinks[exportName] = dependencyLinks[exportName] || [];
            parentLinks[exportName] = parentLinks[exportName] || [];

            const exported = exports[exportName];
            const classNames = [`"${exported.name}"`];

            for (const compose of exported.composes) {
                if (compose.type === 'global') {
                    classNames.push(`"${compose.name}"`);
                }
                if (compose.type === 'local') {
                    const dependencyName = reverseLookup[compose.name];
                    const dependencyExportName = id(dependencyName);
                    classNames.push(
                        dependencyName === undefined ? 'undefined' : `${dependencyExportName}`,
                    );
                    if (dependencyName) {
                        dependencyLinks[exportName] = dependencyLinks[exportName] || [];
                        dependencyLinks[exportName].push(dependencyName);
                        parentLinks[dependencyName] = parentLinks[dependencyName] || [];
                        parentLinks[dependencyName].push(exportName);
                    }
                }
                if (compose.type === 'dependency') {
                    classNames.push(
                        `${id(compose.name)}`,
                    );
                }
            }

            const exportId = id(exportName);
            cssModuleExports[exportName] = {
                name: exportName,
                code: config.isDevMode
                    ? `export const ${exportId} = flatten([${
                        classNames.join(', ')
                    }], moduleName, "${exportName}");\nnames["${exportName}"] = ${exportId};`
                    : `export const ${exportId} = ${
                        classNames.length === 1
                            ? `${classNames[0]}`
                            : `[${classNames.join(', ')}].join(' ')`
                    };\nnames["${exportName}"] = ${exportId};`,
            };
        }

        const queue = Object.values(cssModuleExports).filter((
            cssModuleExport,
        ) => {
            return parentLinks[cssModuleExport.name].length === 0;
        });
        const orderedExports = [];
        let current: CssModuleExport | undefined = undefined;
        while ((current = queue.pop()) !== undefined) {
            orderedExports.push(current);
            const currentName = current.name;
            const dependencies = dependencyLinks[currentName];
            delete parentLinks[currentName];
            delete dependencyLinks[currentName];
            for (const dependency of dependencies) {
                parentLinks[dependency] = parentLinks[dependency].filter(
                    (parent) => parent !== currentName,
                );
                if (parentLinks[dependency].length === 0) {
                    queue.push(cssModuleExports[dependency]);
                }
            }
        }

        if (Object.keys(dependencyLinks).length !== 0) {
            throw Error(`Dependency cycle detected in css module "${name}"`);
        }

        orderedExports.reverse();

        for (const cssExport of orderedExports) {
            cssModuleContent.push(cssExport.code);
        }

        cssModuleContent.push(
            config.isDevMode ? `export default wrap(names, moduleName);` : `export default names`,
        );

        return cssModuleContent.join('\n');
    }
}

function id(str: string): string;
function id(str?: string | undefined): undefined;
function id(str?: string | undefined): string | undefined {
    if (str === undefined) {
        return undefined;
    }

    return `${
        str?.split(/\W+/).map((word) => `${word[0].toUpperCase()}${word.slice(1)}`).join('')
    }_${hashCode(str)}`;
}

function hashCode(str: string) {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        const chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }

    return hash < 0 ? `m${-hash}` : `p${hash}`;
}
