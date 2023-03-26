import * as XXH64 from '../../../dep/xxhash.ts';
import * as path from '../../../dep/std/path.ts';
import * as fs from '../../../dep/std/fs.ts';
import * as cheerio from '../../../dep/cheerio.ts';

import { Asset, Plugin, RegisteredPlugin } from '../../Plugin.ts';
import { log } from '../../log.ts';
import { Config } from '../../Config.ts';

type SvgOptions = {
    outdir: string;
    filter: RegExp;
};

export function svg(
    { outdir = 'svg/', filter = /\.svg$/ }: Partial<SvgOptions> = {},
): Plugin {
    return {
        name: 'svg',
        create(build) {
            build.includeAsset({ type: 'svg', filter });

            const esbuildPlugin = esbuildSvgPlugin({
                filter,
                config: build.config,
                outdir,
            });

            build.register(esbuildPlugin);

            build.onBuildAssets(async ({ getAssets }) => {
                log('bundling svg spritesheets ', { scope: 'plugin:svg' });

                const assets = getAssets('svg');

                const spritesheets: Record<string, Symbol[]> = {};

                await Promise.all(assets.map(async (asset) => {
                    const { spritesheet, symbol } = await getSymbol(asset);
                    spritesheets[spritesheet] = spritesheets[spritesheet] ?? [];
                    spritesheets[spritesheet].push(symbol);
                }));

                const generated = [];

                for (const [name, symbols] of Object.entries(spritesheets)) {
                    const svg = renderSpritesheet(symbols, build.config);
                    const svgPath = path.join('svg', name);
                    const svgUrl = new URL(svgPath, build.config.publicdir);

                    generated.push(`/${svgPath}`);

                    await fs.ensureFile(svgUrl);
                    await Deno.writeTextFile(svgUrl, svg);
                }

                return generated;
            });
        },
    };
}

type ServerSvgOptions = {
    filter: RegExp;
    config: Config;
    outdir: string;
};

function esbuildSvgPlugin(
    { filter, config, outdir }: ServerSvgOptions,
): RegisteredPlugin {
    return {
        type: 'server',
        setup(build) {
            build.onLoad({ filter }, async (args) => {
                const { specifier, loaded } = await config.loader.load(args);

                const { id, basename } = await symbolUrl(
                    path.fromFileUrl(new URL(specifier)),
                );

                log(
                    `found svg symbol "${
                        path.relative(
                            path.fromFileUrl(
                                new URL('.', config.self),
                            ),
                            path.fromFileUrl(new URL(specifier)),
                        )
                    }"`,
                    {
                        kind: 'debug',
                        scope: 'plugin:svg',
                    },
                );

                return {
                    ...loaded,
                    contents: `/${outdir}${basename}#${id}`,
                    loader: 'text',
                };
            });
        },
    };
}

function renderSpritesheet(symbols: Symbol[], config: Config) {
    const seenId: Record<string, string[]> = {};
    const svgContent = [];
    const defs = [];
    for (const symbol of symbols) {
        for (const id of symbol.gatheredIds) {
            seenId[id] = seenId[id] ?? [];
            seenId[id].push(symbol.path);
        }

        if (symbol.defs) {
            defs.push(symbol.defs);
        }

        const symbolAttributes = Object.entries(
            symbol.attributes,
        ).filter(([key, _]) =>
            ['id', 'viewBox', 'preserveAspectRatio']
                .includes(key)
        ).map(([key, value]) => `${key}="${value}"`).join(
            ' ',
        );

        svgContent.push(
            `<symbol ${symbolAttributes}>${symbol.content}</symbol><use href="#${
                symbol.attributes['id']
            }" />`,
        );
    }

    for (const [id, paths] of Object.entries(seenId)) {
        if (paths.length > 1) {
            log(
                `found the same id "${id}" in multiple symbols : ${
                    paths.map((conflictPath) =>
                        path.relative(
                            path.fromFileUrl(
                                new URL('.', config.self),
                            ),
                            conflictPath,
                        )
                    ).join(', ')
                }`,
                { scope: 'plugin:svg', kind: 'warning' },
            );
        }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg">${
        defs.length !== 0 ? `<defs>${defs.join('\n')}</defs>` : ''
    }${svgContent.join('\n')}</svg>`;
}

type Symbol = {
    attributes: Record<string, string>;
    gatheredIds: string[];
    defs?: string;
    content?: string;
    path: string;
};

async function getSymbol(asset: Asset) {
    const assetPath = path.fromFileUrl(asset.url);
    const svg = await Deno.readTextFile(assetPath);

    const { id, basename } = await symbolUrl(assetPath);

    const $ = cheerio.load(svg, {
        xml: true,
    });

    const $svg = $('svg');

    console.log($svg.html());

    const symbol: Symbol = {
        attributes: $svg.attr() ?? {},
        gatheredIds: [],
        path: assetPath,
    };

    symbol.attributes['id'] = id;

    $svg.find('[id]').each((index, element) => {
        const id = $(element).attr('id');
        if (id !== undefined) {
            symbol.gatheredIds.push(id);
        }
    });

    const $defs = $svg.find(`defs`);
    if ($defs.children().length) {
        symbol.defs = $defs.html() ?? undefined;
    }
    $defs.remove();

    symbol.content = $svg.html() ?? undefined;

    return { spritesheet: basename, symbol };
}

async function symbolUrl(svgPath: string) {
    const svg = await Deno.readTextFile(svgPath);
    const svgHash = (await XXH64.create()).update(svg)
        .digest('hex');

    const id = `${path.basename(svgPath, path.extname(svgPath))}-${svgHash}`;
    const spritesheet = path.basename(path.dirname(svgPath));

    return {
        id,
        basename: `${spritesheet}.svg`,
    };
}
