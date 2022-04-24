import * as path from '../../dep/std/path.ts';
import * as fs from '../../dep/std/fs.ts';
import * as murmur from '../murmur/mod.ts';
import * as log from '../log/mod.ts';

import * as frugal from '../core/mod.ts';
import { SpriteSheet } from './spritesheet.ts';

function logger() {
    return log.getLogger('frugal:loader:jsx_svg');
}

type Config = {
    test: (url: URL) => boolean;
    // deno-lint-ignore no-explicit-any
    jsx: (name: string, props: any) => any;
};

export function svg(config: Config): frugal.Loader<string, void> {
    return {
        name: 'jsx-svg',
        test: config.test,
        generate,
    };

    async function generate(
        { getCache, assets, dir }: frugal.GenerateParams<void>,
    ): Promise<string> {
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

                const svgModule = new URL('./spritesheet.ts', import.meta.url);

                const svgGeneratorScript = `
export { SPRITESHEETS as spritesheets } from "${svgModule}";
${
                    assets.map(({ module }) =>
                        `import "${module}";`
                    ).join('\n')
                }
`;

                const { spritesheets } = await import(
                    URL.createObjectURL(new Blob([svgGeneratorScript]))
                );

                await write(spritesheets, dir.public, config.jsx);

                logger().debug({
                    op: 'done',
                    msg() {
                        return `${this.logger!.timerEnd} ${this.op}`;
                    },
                    logger: {
                        timerEnd: `real generation`,
                    },
                });

                return bundleHash;
            },
            otherwise() {
                logger().debug({
                    msg: 'nothing new to generate',
                });
            },
        });
    }
}

export async function write<NODE>(
    spritesheets: SpriteSheet<NODE>[],
    publicDir: string,
    // deno-lint-ignore no-explicit-any
    jsx: (name: string, props: any) => NODE,
) {
    await Promise.all(
        spritesheets.map(async (spritesheet) => {
            try {
                const svgContent = spritesheet.output(jsx);
                const url = spritesheet.url();

                const svgPath = path.join(publicDir, url);
                await fs.ensureDir(path.dirname(svgPath));

                logger().debug({
                    path: svgPath,
                    sprites: spritesheet.sprites.map((sprite) => sprite.id),
                    msg() {
                        return `output ${this.path} containing ${
                            (this.sprites as string[]).join(',')
                        }`;
                    },
                });

                await Deno.writeTextFile(svgPath, svgContent);
            } catch (e) {
                throw e;
            }
        }),
    );
}
