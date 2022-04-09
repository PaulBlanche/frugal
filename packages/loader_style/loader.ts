import * as path from '../../dep/std/path.ts';
import * as fs from '../../dep/std/fs.ts';
import * as log from '../log/mod.ts';

import * as murmur from '../murmur/mod.ts';
import * as frugal from '../core/mod.ts';

function logger() {
    return log.getLogger('frugal:loader:style');
}

type Config = {
    test: (url: URL) => boolean;
    transform?: (bundle: string) => string;
};

export function style(config: Config): frugal.Loader<string, string> {
    return {
        name: 'style',
        test: config.test,
        generate,
    };

    async function generate({ assets, getCache, dir }: frugal.GenerateParams) {
        logger().debug({
            msg: 'generate',
        });

        const cache = await getCache();

        const bundleHash = assets.reduce((hash, asset) => {
            return hash.update(asset.hash);
        }, new murmur.Hash()).alphabetic();

        return cache.memoize({
            key: bundleHash,
            producer: async () => {
                logger().debug({
                    op: 'start',
                    msg() {
                        return `${this.op} ${this.logger!.timerStart}`;
                    },
                    logger: {
                        timerStart: `real generation`,
                    },
                });

                const styleModule = new URL(
                    path.resolve(
                        path.dirname(new URL(import.meta.url).pathname),
                        './styled.ts',
                    ),
                    import.meta.url,
                );

                const styleGeneratorScript = `
import * as style from "${styleModule}";
${
                    assets.map(({ module }) =>
                        `await import("${module}");`
                    ).join('\n')
                }
export const output = style.output()`;

                const { output } = await import(
                    URL.createObjectURL(new Blob([styleGeneratorScript]))
                );
                const bundle = config.transform
                    ? config.transform(output)
                    : output;

                const bundleHash = new murmur.Hash()
                    .update(bundle)
                    .alphabetic();

                const bundleName = `style-${bundleHash}`;
                const bundleUrl = `/style/${bundleName}.css`;
                const bundlePath = path.join(dir.public, bundleUrl);

                logger().debug({
                    url: bundleUrl,
                    msg() {
                        return `output ${this.url}`;
                    },
                });

                await fs.ensureDir(path.dirname(bundlePath));
                await Deno.writeTextFile(bundlePath, bundle);

                logger().debug({
                    op: 'done',
                    msg() {
                        return `${this.logger!.timerEnd} ${this.op}`;
                    },
                    logger: {
                        timerEnd: `real generation`,
                    },
                });

                return bundleUrl;
            },
            otherwise: () => {
                logger().debug({
                    msg: 'nothing new to generate',
                });
            },
        });
    }
}
