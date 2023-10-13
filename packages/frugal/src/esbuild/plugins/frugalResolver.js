import * as esbuild from "../../../dependencies/esbuild.js";
import * as path from "../../../dependencies/path.js";
import * as fs from "../../../dependencies/fs.js";

import * as context from "../../Plugin.js";

const PACKAGE_ROOT_URL = new URL("../../../", import.meta.url);

const NAMESPACE = "frugal";

/**
 * @param {context.Context} context
 * @returns {esbuild.Plugin}
 */
export function frugalResolver(context) {
    switch (context.config.platform) {
        case "deno": {
            return frugalDenoResolver();
        }
        case "node": {
            return frugalNodeResolver();
        }
    }
}

/** @returns {esbuild.Plugin} */
function frugalNodeResolver() {
    return {
        name: "__frugal__internal:frugalNodeResolver",
        setup(build) {
            // resolve import of frugal lib in frugal namespace
            build.onResolve({ filter: /^frugal(|\/.*)?$/ }, async (args) => {
                return {
                    path: path.fromFileURL(import.meta.resolve(args.path)),
                    namespace: NAMESPACE,
                };
            });

            // resolve any dependencies in frugal namespace to the `node` version
            build.onResolve({ filter: /\.\/dependencies\//, namespace: NAMESPACE }, (args) => {
                const dirname = path.dirname(args.path);
                const basename = path.basename(args.path, path.extname(args.path));

                return {
                    path: path.resolve(path.dirname(args.importer), dirname, basename, "node.js"),
                    namespace: NAMESPACE,
                };
            });

            // resolve any internal, non dependencies module in frugal namespace
            build.onResolve({ filter: /^[\.\/].*/, namespace: NAMESPACE }, (args) => {
                return {
                    path: path.resolve(path.dirname(args.importer), args.path),
                    namespace: NAMESPACE,
                };
            });

            // resolve any external modules (non absolute, non relative) as
            // external (they will be loaded by node during runtime)
            build.onResolve({ filter: /^[^\/\.]/ }, async (args) => {
                return {
                    path: args.path,
                    external: true,
                };
            });

            // load any module in namespace frugal from fs
            build.onLoad({ filter: /.*/, namespace: NAMESPACE }, async (args) => {
                return {
                    contents: await fs.readFile(args.path),
                    loader: "js",
                };
            });
        },
    };
}

const FRUGAL_FILTER = new RegExp(escapeRegExp(PACKAGE_ROOT_URL.href));

/** @returns {esbuild.Plugin} */
function frugalDenoResolver() {
    return {
        name: "__frugal__internal:frugalDenoResolver",
        async setup(build) {
            const cache = await caches.open("toto");

            // resolve url to frugal lib in frugal namespace
            build.onResolve({ filter: FRUGAL_FILTER }, (args) => {
                const url = new URL(args.path);
                return {
                    path: url.toString(),
                    namespace: NAMESPACE,
                };
            });

            // resolve any dependencies in frugal namespace to the `deno` version
            build.onResolve({ filter: /\.\/dependencies\//, namespace: NAMESPACE }, (args) => {
                const dirname = path.dirname(args.path);
                const basename = path.basename(args.path, path.extname(args.path));

                const url = new URL(path.join(dirname, basename, "deno.js"), args.importer);

                return {
                    path: url.toString(),
                    namespace: NAMESPACE,
                };
            });

            // resolve any internal, non dependencies module in frugal namespace
            build.onResolve({ filter: /^[\.\/].*/, namespace: NAMESPACE }, (args) => {
                const url = new URL(args.path, args.importer);
                return {
                    path: url.toString(),
                    namespace: NAMESPACE,
                };
            });

            // resolve any external modules (non absolute, non relative) as
            // external (they will be loaded by deno during runtime)
            build.onResolve({ filter: /^[^\/\.]/ }, async (args) => {
                return {
                    path: args.path,
                    external: true,
                };
            });

            // load any module in namespace frugal from url
            build.onLoad({ filter: /.*/, namespace: NAMESPACE }, async (args) => {
                const url = new URL(args.path);
                const cached = await cache.match(url);
                if (cached) {
                    return {
                        contents: await cached.text(),
                        loader: "ts",
                    };
                }
                const response = await fetch(url);
                return {
                    contents: await response.text(),
                    loader: "ts",
                };
            });
        },
    };
}

/**
 * @param {string} string
 * @returns
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
