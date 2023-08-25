import * as path from "../../dep/std/path.ts";
import * as xxhash from "../../dep/xxhash.ts";

import { transformAsync } from "https://esm.sh/@babel/core@7.22.10";
import solid from "https://esm.sh/babel-preset-solid@1.7.7";
import { Plugin } from "../Plugin.ts";
import ts from "npm:@babel/preset-typescript@7.22.5";

type SolidjsOptions = {
    filter: RegExp;
};

export function solidjs(
    { filter = /\.[tj]sx$/ }: Partial<SolidjsOptions> = {},
): Plugin {
    return (frugal) => {
        return {
            name: "frugal:solidjs",
            setup(build) {
                const isInScript = build.initialOptions.define?.["import.meta.environment"] === "'client'";
                const solidCompiler = new SolidCompiler();

                build.onLoad({ filter }, async (args) => {
                    try {
                        const source = await frugal.load(frugal.url(args));

                        const { code } = await solidCompiler.compile(source, args.path, {
                            generate: isInScript ? "dom" : "ssr",
                            hydratable: true,
                        });

                        return { contents: code, loader: "js" };
                    } catch (e) {
                        console.log(e);
                        throw e;
                    }
                });
            },
        };
    };
}

class SolidCompiler {
    #cache: Map<string, { code: string }>;

    constructor() {
        this.#cache = new Map();
    }

    async compile(contents: Uint8Array, filePath: string, options: any) {
        const hash = (await xxhash.create()).update(contents).digest("hex").toString();
        const key = `${filePath}-${hash}-${options.generate}`;

        const cachedResult = this.#cache.get(key);
        if (cachedResult) {
            return cachedResult;
        }

        const result = await this.#rawCompile(contents, filePath, options);
        this.#cache.set(key, result);
        return result;
    }

    async #rawCompile(contents: Uint8Array, filePath: string, options: any) {
        const { name, ext } = path.parse(filePath);
        const filename = name + ext;

        const result = await transformAsync(new TextDecoder().decode(contents), {
            presets: [[solid, options], [ts, {}]],
            filename,
            sourceMaps: "inline",
        });

        if (result?.code === undefined || result.code === null) {
            throw new Error("No result was provided from Babel");
        }

        return { code: result.code };
    }
}
