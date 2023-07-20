import * as esbuild from "../../../dep/esbuild.ts";

import { WATCH_MESSAGE_SYMBOL } from "../../watch/ChildContext.ts";

export function watchEmitter(): esbuild.Plugin {
    return {
        name: "__frugal_internal:watchEmitter",
        setup(build) {
            build.onStart(() => {
                console.log({
                    type: "start-build",
                    [WATCH_MESSAGE_SYMBOL]: true,
                });
            });

            build.onEnd((result) => {
                if (result.errors.length === 0) {
                    console.log({
                        type: "end-build",
                        [WATCH_MESSAGE_SYMBOL]: true,
                    });
                }
            });
        },
    };
}
