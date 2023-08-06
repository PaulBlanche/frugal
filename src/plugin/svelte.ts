import * as path from "../../dep/std/path.ts";
import * as xxhash from "../../dep/xxhash.ts";
import * as svelteCompiler from "svelte/compiler";
import type { PreprocessorGroup } from "svelte/types/compiler/preprocess/types.d.ts";

import { Plugin } from "../Plugin.ts";
import { log } from "../log.ts";
import { isInChildWatchProcess } from "../WatchContext.ts";

type SvelteOptions = {
    filter: RegExp;
    preprocess?: PreprocessorGroup | PreprocessorGroup[];
};

export function svelte({ filter = /\.svelte$/, preprocess }: Partial<SvelteOptions> = {}): Plugin {
    return (frugal) => {
        return {
            name: "frugal:svelte",
            setup(build) {
                const isInScript = build.initialOptions.define?.["import.meta.main"] === "true";
                const cssLoader = build.initialOptions.loader?.[".css"] ?? "css";

                const svelteCompiler = new SvelteCompiler({
                    preprocess,
                });

                const cssCache = new Map<string, string>();

                // server side, resolve "svelte" to "svelte/ssr" (see https://github.com/sveltejs/svelte/issues/6372)
                build.onResolve({ filter: /^svelte$/ }, (args) => {
                    return build.resolve("svelte/ssr", {
                        pluginName: "svelte:server",
                        importer: args.importer,
                        namespace: args.namespace,
                        resolveDir: args.resolveDir,
                        kind: args.kind,
                        pluginData: args.pluginData,
                    });
                });

                build.onResolve({ filter }, (args) => {
                    const url = frugal.url(args);
                    if (url.protocol !== "file:") {
                        throw Error(`Can't bundle remote svelte module ${url.href}`);
                    }

                    return { path: args.path, namespace: args.namespace };
                });

                // resolve generated css as virtual files
                build.onResolve({ filter: /\.frugal-compiled-svelte-module\.css$/ }, (args) => {
                    if (cssCache.has(args.path)) {
                        return { path: args.path, namespace: "virtual" };
                    }
                });

                build.onLoad({ filter: /\.frugal-compiled-svelte-module\.css$/, namespace: "virtual" }, (args) => {
                    const contents = cssCache.get(args.path);
                    return { loader: cssLoader, contents };
                });

                build.onLoad({ filter }, async (args) => {
                    const url = frugal.url(args);
                    if (url.protocol !== "file:") {
                        throw Error(`Can't bundle remote svelte module ${url.href}`);
                    }

                    log(
                        `found svelte module "${args.path}"${isInScript ? " (in script)" : ""}`,
                        { scope: "frugal:svelte", level: "debug" },
                    );

                    const modulePath = path.fromFileUrl(url);
                    const contents = await frugal.load(url);

                    const module = await svelteCompiler.compile(
                        contents,
                        modulePath,
                        {
                            ...isInScript
                                ? {
                                    generate: "dom",
                                    hydratable: true,
                                }
                                : {
                                    generate: "ssr",
                                },
                            preserveComments: true,
                            dev: isInChildWatchProcess(),
                            css: "external",
                        },
                    );

                    if ("error" in module) {
                        console.log(module.error);
                        return {
                            errors: [convertMessage(module.error)],
                            watchFiles: module.dependencies,
                        };
                    }

                    if (module.css) {
                        cssCache.set(module.css.filename, module.css.code);
                    }

                    return {
                        loader: "js",
                        contents: module.js.code,
                        watchFiles: Array.from(module.dependencies.keys()),
                        warnings: module.warnings.map(convertMessage),
                    };
                });
            },
        };
    };
}

type SourceMap = {
    toString(): string;
    toUrl(): string;
};

type Module = {
    contents: Uint8Array;
    css?: { code: string; filename: string };
    js: { code: string; sourcemap: SourceMap };
    warnings: any[];
    dependencies: Map<string, Date>;
};

type Config = {
    preprocess?: PreprocessorGroup | PreprocessorGroup[];
};

class SvelteCompiler {
    #cache: Map<string, Module>;
    #config: Config;

    constructor(config: Config = {}) {
        this.#cache = new Map();
        this.#config = config;
    }

    async compile(
        contents: Uint8Array,
        filename: string,
        options: any,
    ): Promise<Module | { error: any; dependencies?: string[] }> {
        const key = `${filename}-${options.generate}`;

        const module = this.#cache.get(key);
        if (module) {
            // check wether any preprocess dependencies for the compiled file
            // have changed since it was cached.
            const promises: Promise<boolean>[] = [];
            module.dependencies.forEach((time, path) => {
                promises.push((async () => {
                    const stat = await Deno.stat(new URL(path));
                    return stat.mtime !== null && stat.mtime <= time;
                })());
            });

            const isCacheValid = (await Promise.all(promises)).reduce(
                (isCacheValid, isDependencyValid) => isCacheValid && isDependencyValid,
                true,
            );

            if (isCacheValid) {
                return module;
            } else {
                this.#cache.delete(key);
            }
        }

        try {
            const module = await this.#rawCompile(contents, filename, options);
            this.#cache.set(key, module);
            return module;
        } catch (error) {
            return { error, dependencies: module ? Array.from(module?.dependencies.keys()) : undefined };
        }
    }

    async #rawCompile(
        contents: Uint8Array,
        filename: string,
        options: any,
    ): Promise<Module> {
        const source = typeof contents === "string" ? contents : new TextDecoder().decode(contents);

        let preprocessedSource = source;
        let sourcemap;
        let dependencies = [];
        if (this.#config.preprocess) {
            const preprocessed = await svelteCompiler.preprocess(
                source,
                this.#config.preprocess,
                {
                    filename,
                },
            );

            preprocessedSource = preprocessed.code;
            sourcemap = preprocessed.map;
            dependencies = preprocessed.dependencies;
        }

        const { js, css, warnings } = svelteCompiler.compile(preprocessedSource, {
            ...options,
            filename,
            sourcemap,
        });

        const dependenciesMap = new Map<string, Date>();
        const stat = await Deno.stat(filename);
        if (stat.mtime) {
            dependenciesMap.set(filename, stat.mtime);
        }

        await Promise.all(dependencies.map(async (dependency) => {
            const stat = await Deno.stat(dependency);
            if (stat.mtime) {
                dependenciesMap.set(dependency, stat.mtime);
            }
        }));

        const module: Module = {
            js: js as unknown as Module["js"],
            css: css ?? undefined,
            contents,
            dependencies: dependenciesMap,
            warnings,
        };

        if (module.css?.code && options.generate === "ssr") {
            const contentHash = (await xxhash.create()).update(contents).digest("hex").toString();

            module.css.filename = `/${path.basename(filename)}-${contentHash}.frugal-compiled-svelte-module.css`;

            const js = module.js ?? { code: "" };
            js.code = `import "${module.css.filename}";\n${js.code}`;
            module.js = js;
        }

        return module;
    }
}

type Warning = ReturnType<typeof svelteCompiler.compile>["warnings"][number];

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
