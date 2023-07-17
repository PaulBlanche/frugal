import * as path from "../../dep/std/path.ts";

import { Plugin } from "../Plugin.ts";
import { log } from "../log.ts";

type StyleOptions = {
    filter: RegExp;
};

export function css(
    { filter = /\.css$/ }: Partial<StyleOptions> = {},
): Plugin {
    return (frugal) => {
        return {
            name: "frugal:css",
            setup(build) {
                build.onResolve({ filter }, (args) => {
                    return { path: args.path };
                });

                build.onLoad({ filter }, async (args) => {
                    const url = frugal.url(args);
                    const contents = await frugal.load(url);

                    log(
                        `found css file "${
                            path.relative(
                                path.fromFileUrl(
                                    new URL(".", frugal.config.self),
                                ),
                                path.fromFileUrl(url),
                            )
                        }"`,
                        {
                            level: "debug",
                            scope: "frugal:css",
                        },
                    );

                    return { loader: "empty", contents };
                });
            },
        };
    };
}
