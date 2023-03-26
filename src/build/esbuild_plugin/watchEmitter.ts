import * as esbuild from '../../../dep/esbuild.ts';
import { Config } from '../../Config.ts';
import { WATCH_MESSAGE_SYMBOL } from '../../watch/WatchContext.ts';

export function buildStartEmitter(config: Config): esbuild.Plugin {
    return {
        name: 'esbuild:start-emitter',
        setup(build) {
            build.onStart(() => {
                if (config.isDevMode) {
                    console.log({
                        type: 'start-build',
                        [WATCH_MESSAGE_SYMBOL]: true,
                    });
                }
            });
        },
    };
}

export function buildEndEmitter(config: Config): esbuild.Plugin {
    return {
        name: 'esbuild:end-emitter',
        setup(build) {
            build.onEnd((result) => {
                if (config.isDevMode && result.errors.length === 0) {
                    console.log({
                        type: 'end-build',
                        [WATCH_MESSAGE_SYMBOL]: true,
                    });
                }
            });
        },
    };
}
