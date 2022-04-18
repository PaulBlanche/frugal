import * as path from '../../dep/std/path.ts';
import * as fs from '../../dep/std/fs.ts';
import * as murmur from '../murmur/mod.ts';
import * as log from '../log/mod.ts';

import * as frugal from '../core/mod.ts';
import { SVGFile } from './svg-sprite.ts';

function logger() {
    return log.getLogger('frugal:loader:jsx_svg');
}

type Config = {
    test: (url: URL) => boolean;
    // deno-lint-ignore ban-types
    jsx: Function;
    // deno-lint-ignore ban-types
    render: Function;
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

                const svgModule = new URL(
                    path.resolve(
                        path.dirname(new URL(import.meta.url).pathname),
                        './svg-sprite.ts',
                    ),
                    import.meta.url,
                );

                const svgGeneratorScript = `
import * as svg from "${svgModule}";
${
                    assets.map(({ module }) =>
                        `import "${module}";`
                    ).join('\n')
                }
export const output = svg.output()`;

                const { output } = await import(
                    URL.createObjectURL(new Blob([svgGeneratorScript]))
                );

                await write(output, dir.public, config.jsx, config.render);

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

export async function write(
    svgFiles: Record<string, SVGFile>,
    publicDir: string,
    // deno-lint-ignore ban-types
    jsx: Function,
    // deno-lint-ignore ban-types
    render: Function,
) {
    await Promise.all(
        Object.values(svgFiles).map(async (svgFile) => {
            try {
                const svgContent = render(jsx(
                    'svg',
                    { xmlns: 'http://www.w3.org/2000/svg' },
                    jsx(
                        'defs',
                        {
                            children: svgFile.sprites.map((sprite) => {
                                return jsx(
                                    'g',
                                    {
                                        key: sprite.id,
                                        id: sprite.id,
                                        children: sprite.children,
                                    },
                                );
                            }),
                        },
                    ),
                ));

                const svgPath = path.join(publicDir, svgFile.url);
                await fs.ensureDir(path.dirname(svgPath));

                logger().debug({
                    path: svgPath,
                    sprites: svgFile.sprites.map((sprite) => sprite.id),
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
