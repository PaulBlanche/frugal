import * as rollup from '../../dep/rollup.ts';
import * as frugal from '../core/mod.ts';
import * as murmur from '../murmur/mod.ts';
import * as log from '../log/mod.ts';

import { bundle, CODE_SPLIT_CACHE_KEY, INLINE_CACHE_KEY } from './bundle.ts';

function logger() {
    return log.getLogger('frugal:loader:script');
}

type Config = {
    test: (url: URL) => boolean;
    name: string;
    order?(modules: string[]): string[];
    input?: Omit<rollup.InputOptions, 'input'>;
    outputs?: rollup.OutputOptions[];
    inline?: boolean;
    end?: () => void;
};

export type Generated = Record<string, Record<string, string>>;

export function script(
    config: Config,
): frugal.Loader<Record<string, Record<string, string>>> {
    return {
        name: `script-${config.name}`,
        test: config.test,
        generate,
        end: config.end,
    };

    function generate({ assets, cache, dir }: frugal.GenerateParams) {
        logger().debug({
            msg: 'generate',
        });

        const bundleHash = assets.reduce((hash, asset) => {
            return hash.update(asset.hash);
        }, new murmur.Hash()).alphabetic();

        return cache.memoize({
            key: bundleHash,
            producer: async () => {
                logger().debug({
                    op: 'start',
                    inline: config.inline,
                    msg() {
                        return `${this.op} ${this.logger!.timerStart}`;
                    },
                    logger: {
                        timerStart: `real generation${
                            config.inline ? ' (inline)' : ''
                        }`,
                    },
                });

                const scriptLists = assets.reduce<{ [s: string]: string[] }>(
                    (scriptLists, { module, entrypoint }) => {
                        scriptLists[entrypoint] = scriptLists[entrypoint] ?? [];
                        scriptLists[entrypoint].push(module);
                        return scriptLists;
                    },
                    {},
                );

                const facades = Object.entries(scriptLists).reduce<
                    { entrypoint: string; content: string }[]
                >((facades, [entrypoint, modules]) => {
                    const orderedModules = config.order
                        ? config.order(modules)
                        : modules;

                    facades.push({
                        entrypoint,
                        content: orderedModules.map((path, i) => {
                            const name = `import${i}`;
                            return `import { main as ${name} } from "${path}";
                            ${name}();`;
                        }).join('\n'),
                    });

                    return facades;
                }, []);

                const result = await bundle({
                    cache,
                    input: config.input,
                    inline: config.inline,
                    outputs: config.outputs,
                    publicDir: dir.public,
                    scripts: facades,
                });

                logger().debug({
                    op: 'done',
                    inline: config.inline,
                    msg() {
                        return `${this.logger!.timerEnd} ${this.op}`;
                    },
                    logger: {
                        timerEnd: `real generation${
                            config.inline ? ' (inline)' : ''
                        }`,
                    },
                });

                return result;
            },
            otherwise: () => {
                logger().debug({
                    msg: 'nothing new to generate',
                });

                cache.propagate(CODE_SPLIT_CACHE_KEY);
                const entrypoints = [
                    ...new Set(assets.map((asset) => asset.entrypoint)),
                ];

                for (const entrypoint of entrypoints) {
                    cache.propagate(INLINE_CACHE_KEY(entrypoint));
                }
            },
        });
    }
}
