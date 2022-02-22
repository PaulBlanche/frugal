import * as rollup from '../../dep/rollup.ts';
import * as frugal from '../core/mod.ts';
import * as murmur from '../murmur/mod.ts';

import { bundle, CODE_SPLIT_CACHE_KEY, INLINE_CACHE_KEY } from './bundle.ts';

type Config = {
    test: (url: URL) => boolean;
    name: string;
    order?(modules: string[]): string[];
    input?: Omit<rollup.InputOptions, 'input'>;
    outputs?: rollup.OutputOptions[]
    inline?: boolean;
    end?: () => void;
};

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
        const bundleHash = assets.reduce((hash, asset) => {
            return hash.update(asset.hash);
        }, new murmur.Hash()).alphabetic();

        return cache.memoize({
            key: bundleHash,
            producer: () => {
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
                            return `import { main as ${name} } from "${path}";
                            ${name}();`;
                        }).join('\n'),
                    });

                    return facades;
                }, []);

                return bundle({
                    cache,
                    input: config.input,
                    inline: config.inline,
                    outputs: config.outputs,
                    publicDir: dir.public,
                    scripts: facades,
                });
            },
            otherwise: () => {
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
