import * as _type from "./_type/cssModule.js";
export * from "./_type/cssModule.js";

import * as path from "../../../dependencies/path.js";
import * as fs from "../../../dependencies/fs.js";
import * as xxhash from "../../../dependencies/xxhash.js";

import * as plugin from "../../Plugin.js";
import { Bundler } from "./Bundler.js";

/**
 * @param {Partial<_type.CssModuleOptions>} [param0]
 * @returns {plugin.Plugin}
 */
export function cssModule({ filter = /\.module.css$/, pattern, dashedIdents } = {}) {
    return (frugal) => {
        return {
            name: "frugal:cssModule",
            setup(build) {
                const cssLoader = build.initialOptions.loader?.[".css"] ?? "css";

                const bundler = new Bundler({
                    sourceMap: Boolean(build.initialOptions.sourcemap),
                    projectRoot: build.initialOptions.absWorkingDir,
                    options: {
                        pattern,
                        dashedIdents,
                    },
                });

                /** @type {Map<string, Uint8Array>} */
                const cssCache = new Map();

                build.onResolve({ filter: /\.frugal-compiled-css-module\.css$/ }, (args) => {
                    if (cssCache.has(args.path)) {
                        return { path: args.path, namespace: "virtual" };
                    }
                });

                build.onResolve({ filter: /cssModuleHelper:format\.js/ }, (args) => {
                    return { path: args.path, namespace: "cssModuleHelper" };
                });

                build.onLoad(
                    { filter: /cssModuleHelper:format\.js/, namespace: "cssModuleHelper" },
                    async (args) => {
                        return {
                            loader: "js",
                            contents: await fs.readFile(
                                path.fromFileURL(import.meta.resolve("./format.js")),
                            ),
                        };
                    },
                );

                build.onResolve({ filter }, (args) => {
                    return {
                        path: path.resolve(path.dirname(args.importer), args.path),
                        namespace: args.namespace,
                    };
                });

                build.onLoad(
                    { filter: /\.frugal-compiled-css-module\.css$/, namespace: "virtual" },
                    (args) => {
                        const contents = cssCache.get(args.path);
                        return { loader: cssLoader, contents, resolveDir: path.dirname(args.path) };
                    },
                );

                build.onLoad({ filter }, async (args) => {
                    const contents = await fs.readFile(args.path);
                    const contentHash = (await xxhash.create()).update(contents).digest();

                    const cssPath = path.resolve(
                        path.dirname(args.path),
                        `${path.basename(args.path)}-${contentHash}.frugal-compiled-css-module.css`,
                    );

                    const module = await bundler.bundle(args.path, cssPath, contents);

                    cssCache.set(cssPath, module.css);

                    return { loader: "js", contents: module.js };
                });
            },
        };
    };
}
