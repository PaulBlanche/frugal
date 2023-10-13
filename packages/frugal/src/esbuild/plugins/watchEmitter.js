import * as esbuild from "../../../dependencies/esbuild.js";

import { WATCH_MESSAGE_SYMBOL } from "../../watch/ChildContext.js";

/** @returns {esbuild.Plugin} */
export function watchEmitter() {
    return {
        name: "frugal-internal:watchEmitter",
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
