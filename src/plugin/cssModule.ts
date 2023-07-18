import * as lightningcss from "../../dep/lightningcss.ts";
import * as path from "../../dep/std/path.ts";
import * as xxhash from "../../dep/xxhash.ts";

import { Plugin } from "../Plugin.ts";
import { log } from "../log.ts";

type CssModuleOptions = {
    filter: RegExp;
    pattern?: string;
};

export function cssModule({ filter = /\.module.css$/, pattern }: Partial<CssModuleOptions> = {}): Plugin {
    return (frugal) => {
        return {
            name: "frugal:cssModule",
            setup(build) {
                const cssModuleBuilder = new CssModuleBuilder({
                    sourceMap: Boolean(build.initialOptions.sourcemap),
                    projectRoot: build.initialOptions.absWorkingDir,
                    pattern,
                });

                const cssCache = new Map<string, Uint8Array>();

                build.onResolve({ filter: /\.frugal-compiled-module.css/ }, (args) => {
                    if (cssCache.has(args.path)) {
                        return { path: args.path, namespace: "virtual" };
                    }
                });

                build.onResolve({ filter }, (args) => {
                    const url = frugal.url(args);
                    if (url.protocol !== "file:") {
                        throw Error(`Can't bundle remote css module ${url.href}`);
                    }

                    return { path: args.path, namespace: args.namespace };
                });

                build.onLoad({ filter: /\.frugal-compiled-module.css/, namespace: "virtual" }, (args) => {
                    const contents = cssCache.get(args.path);
                    return { loader: "css", contents };
                });

                build.onLoad({ filter }, async (args) => {
                    const url = frugal.url(args);
                    if (url.protocol !== "file:") {
                        throw Error(`Can't bundle remote css module ${url.href}`);
                    }

                    log(
                        `found css module "${args.path}"`,
                        { scope: "frugal:css", level: "debug" },
                    );

                    const modulePath = path.fromFileUrl(url);
                    const contents = await frugal.load(url);
                    const contentHash = (await xxhash.create()).update(contents).digest("hex").toString();

                    const cssPath = `/${path.basename(modulePath)}-${contentHash}.frugal-compiled-module.css`;

                    const module = await cssModuleBuilder.bundle(modulePath, cssPath, contents);

                    cssCache.set(cssPath, module.css);

                    return { loader: "js", contents: module.js };
                });
            },
        };
    };
}

type Module = { contents: Uint8Array; css: Uint8Array; js: string };

type Config = {
    sourceMap?: boolean;
    projectRoot?: string;
    pattern?: string;
};

class CssModuleBuilder {
    #cache: Map<string, Module>;
    #config: Config;

    static INIT_PROMISE: Promise<void> | undefined = undefined;

    constructor(config: Config = {}) {
        this.#cache = new Map();
        this.#config = config;
    }

    async bundle(path: string, cssPath: string, contents: Uint8Array): Promise<Module> {
        const cached = this.#cache.get(path);
        if (cached && isSameUint8Array(cached.contents, contents)) {
            return cached;
        }

        const { code, exports } = await this.#transform(path, contents);

        const js = new CssModuleCompiler(exports ?? {}).compile(cssPath);

        // copy css Uint8Array, because the underlying buffer coming from
        // lightningcss might become detached
        const css = new Uint8Array(code.byteLength);
        css.set(code);

        const module = { contents, css, js };

        this.#cache.set(path, module);
        return module;
    }

    async #transform(path: string, contents: Uint8Array) {
        if (CssModuleBuilder.INIT_PROMISE === undefined) {
            CssModuleBuilder.INIT_PROMISE = lightningcss.default();
        }

        await CssModuleBuilder.INIT_PROMISE;
        return lightningcss.transform({
            filename: path,
            code: contents,
            cssModules: {
                pattern: this.#config.pattern,
            },
            sourceMap: this.#config.sourceMap,
            projectRoot: this.#config.projectRoot,
            targets: {
                chrome: 95 << 16,
            },
            drafts: {
                nesting: true,
            },
        });
    }
}

function isSameUint8Array(a: Uint8Array, b: Uint8Array) {
    return a.byteLength === b.byteLength && a.every((value, index) => b[index] === value);
}

type ClassName =
    | { type: "dependency"; importIdentifier: string; name: string }
    | { type: "local"; name: string; names: ClassName[] }
    | {
        type: "global";
        name: string;
    };

class CssModuleCompiler {
    #exports: lightningcss.CSSModuleExports;
    #counter: number;
    #importIdentifierCache: Record<string, string> = {};
    #classNameCache: Map<string, ClassName[]>;

    constructor(exports: lightningcss.CSSModuleExports) {
        this.#exports = exports;
        this.#counter = 0;
        this.#classNameCache = new Map();
    }

    compile(compiledCssPath: string) {
        return `import "${compiledCssPath}";
${
            Array.from(
                new Set(
                    Object.values(this.#exports).flatMap((exportData) => {
                        return exportData.composes.filter((
                            compose,
                        ): compose is lightningcss.DependencyCSSModuleReference => compose.type === "dependency").map(
                            (compose) => {
                                return compose.specifier;
                            },
                        );
                    }),
                ),
            ).map((specifier) => {
                return `import ${this.#importIdentifier(specifier)} from "${specifier}";`;
            }).join("\n")
        }

export default {
    ${
            Object.entries(this.#exports).map(([exportName, exportData]) => {
                return `"${exportName}": Array.from(new Set(["${exportData.name}", ${
                    this.#getClassNames(exportName).map((className) => {
                        return this.#toJsCode(className);
                    })
                }])),`;
            }).join("\n    ")
        }
}`;
    }

    #toJsCode(className: ClassName): string {
        switch (className.type) {
            case "dependency": {
                return `...${className.importIdentifier}["${className.name}"]`;
            }
            case "global": {
                return className.name;
            }
            case "local": {
                return [`"${className.name}"`, ...className.names.map((className) => this.#toJsCode(className))].join(
                    ", ",
                );
            }
        }
    }

    #importIdentifier(specifier: string) {
        if (!(specifier in this.#importIdentifierCache)) {
            this.#importIdentifierCache[specifier] = `$${this.#counter++}`;
        }

        return this.#importIdentifierCache[specifier];
    }

    #getClassNames(name: string): ClassName[] {
        const cached = this.#classNameCache.get(name);
        if (cached !== undefined) {
            return cached;
        }

        const localExport = this.#exports[name];

        if (localExport === undefined) {
            throw new Error(`name "${name}" is not exported from css module`);
        }

        const classNames = localExport.composes.map((compose): ClassName => {
            if (compose.type === "dependency") {
                return {
                    type: "dependency",
                    importIdentifier: this.#importIdentifier(compose.specifier),
                    name: compose.name,
                };
            } else if (compose.type === "local") {
                return { type: "local", name: compose.name, names: this.#resolveClassNames(compose.name) };
            } else {
                return { type: "global", name: compose.name };
            }
        });

        this.#classNameCache.set(name, classNames);
        return classNames;
    }

    #resolveClassNames(name: string): ClassName[] {
        const found = Object.entries(this.#exports).find(([_, exportData]) => exportData.name === name);

        if (found === undefined) {
            throw new Error("");
        }

        return this.#getClassNames(found[0]);
    }
}
