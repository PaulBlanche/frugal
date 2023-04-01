import * as esbuild from "../../../dep/esbuild.ts";
import * as path from "../../../dep/std/path.ts";

import { Plugin } from "../../Plugin.ts";
import { log } from "../../log.ts";

import * as svelteCompiler from "svelte/compiler";
import type { PreprocessorGroup } from "svelte/types/compiler/preprocess/types.d.ts";

type ScriptOptions = {
  filter: RegExp;
  preprocess?: PreprocessorGroup | PreprocessorGroup[];
};

type SourceMap = {
  toString(): string;
  toUrl(): string;
};

type Warning = ReturnType<typeof svelteCompiler.compile>["warnings"][number];

type Compilation = {
  compiled: {
    js: { code: string; map: SourceMap };
    warnings: Warning[];
  };
  dependencies: string[];
};

type CacheData = {
  data: esbuild.OnLoadResult;
  dependencies: Map<string, Date>;
};

export function svelte(
  { filter = /\.svelte$/, preprocess }: Partial<ScriptOptions> = {},
): Plugin {
  return {
    name: "svelte",
    create(build) {
      const config = build.config;
      const cssCache = new Map<string, string>();

      build.register({
        type: "server",
        setup(build) {
          const compilationCache = new Map<string, CacheData>();

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

          // resolve generated css as virtual files
          build.onResolve({ filter: /\.css$/ }, (args) => {
            if (cssCache.has(args.path)) {
              return { path: args.path, namespace: "virtual" };
            }
          });

          // load generated css as empty files (keeping them in meta.json, but
          // not actually compiled to save time)
          build.onLoad({ filter: /\.css$/, namespace: "virtual" }, (args) => {
            const path = args.path.replace("virtual:", "");
            if (cssCache.has(path)) {
              return { contents: cssCache.get(path), loader: "empty" };
            }
          });

          // compile svelte files for SSR (load the compiled js + import to
          // generated css)
          build.onLoad({ filter }, (args) => {
            return cachedCompile(args, compilationCache, {
              generate: "ssr",
              preserveComments: true,
              dev: config.isDevMode,
              css: "external",
            });
          });
        },
      });

      build.register({
        type: "asset",
        setup(build) {
          const compilationCache = new Map<string, CacheData>();

          // resolve virtual css file generated during server pass
          build.onResolve({ filter: /\.css$/ }, (args) => {
            const path = args.path.replace("virtual:", "");
            if (cssCache.has(path)) {
              return { path, namespace: "virtual" };
            }
          });

          // load virtual css file generated during server pass
          build.onLoad({ filter: /\.css$/, namespace: "virtual" }, (args) => {
            const path = args.path.replace("virtual:", "");
            if (cssCache.has(path)) {
              return { contents: cssCache.get(path), loader: "css" };
            }
          });

          // compile svelte files for DOM (no css outputed here)
          build.onLoad({ filter }, (args) => {
            return cachedCompile(args, compilationCache, {
              generate: "dom",
              hydratable: true,
              preserveComments: true,
              dev: config.isDevMode,
              css: "external",
            });
          });
        },
      });

      async function cachedCompile(
        args: esbuild.OnLoadArgs,
        compilationCache: Map<string, CacheData>,
        options: any,
      ): Promise<esbuild.OnLoadResult> {
        const { specifier, loaded } = await config.loader.load(
          args,
        );

        const entrypoint = build.config.relative(specifier);
        log(
          `found svelte entrypoint "${entrypoint}"`,
          {
            kind: "debug",
            scope: "plugin:svelte",
            extra: JSON.stringify(args),
          },
        );

        let cachedCompilation: undefined | CacheData = undefined;
        if (compilationCache.has(specifier)) {
          cachedCompilation = compilationCache.get(specifier)!;

          // check wether any preprocess dependencies for the compiled file
          // have changed since it was cached.
          const promises: Promise<boolean>[] = [];
          cachedCompilation.dependencies.forEach((time, path) => {
            promises.push((async () => {
              const stat = await Deno.stat(new URL(path));
              return stat.mtime !== null && stat.mtime <= time;
            })());
          });

          const isCacheValid = (await Promise.all(promises)).reduce(
            (isCacheValid, isDependencyValid) =>
              isCacheValid && isDependencyValid,
            true,
          );

          if (isCacheValid) {
            return cachedCompilation.data;
          } else {
            compilationCache.delete(specifier);
          }
        }

        const dependenciesMap = new Map<string, Date>();
        const stat = await Deno.stat(new URL(specifier));
        if (stat.mtime) {
          dependenciesMap.set(specifier, stat.mtime);
        }

        try {
          const { compiled: { js, warnings }, dependencies } = await compile(
            loaded.contents,
            specifier,
            options,
          );

          // cache preprocess dependencies with mtime for cache invalidation
          await Promise.all(dependencies.map(async (dependency) => {
            const stat = await Deno.stat(dependency);
            if (stat.mtime) {
              dependenciesMap.set(dependency, stat.mtime);
            }
          }));

          const result: esbuild.OnLoadResult = {
            ...loaded,
            contents: js.code,
            loader: "js",
            watchFiles: Array.from(dependenciesMap.keys()),
            warnings: warnings.map(convertMessage),
          };

          compilationCache.set(specifier, {
            data: result,
            dependencies: dependenciesMap,
          });

          console.log({
            data: result,
            dependencies: dependenciesMap,
          });

          return result;
        } catch (e) {
          // it compilation failed, keep watching the currently cached
          // dependencies if it exists
          return {
            errors: [convertMessage(e)],
            watchFiles: cachedCompilation
              ? Array.from(cachedCompilation.dependencies.keys())
              : undefined,
          };
        }
      }

      async function compile(
        contents: Uint8Array | string,
        specifier: string,
        options: any,
      ): Promise<Compilation> {
        const source = typeof contents === "string"
          ? contents
          : new TextDecoder().decode(contents);

        let preprocessedSource = source;
        let sourcemap;
        let dependencies = [];
        if (preprocess) {
          console.log("do preprocess");
          const preprocessed = await svelteCompiler.preprocess(
            source,
            preprocess,
            {
              filename: specifier,
            },
          );

          preprocessedSource = preprocessed.code;
          sourcemap = preprocessed.map;
          dependencies = preprocessed.dependencies;
        }

        const compiled = svelteCompiler.compile(preprocessedSource, {
          ...options,
          filename: specifier,
          sourcemap,
        });

        if (compiled.css.code && options.generate === "ssr") {
          const entrypoint = build.config.relative(specifier);
          const identifier = `${entrypoint}.css`;
          cssCache.set(identifier, compiled.css.code);

          console.log(compiled.css.code);

          compiled.js.code = `${compiled.js.code}\nimport "${identifier}";`;
        }

        return { compiled, dependencies };
      }
    },
  };
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
