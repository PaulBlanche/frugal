import * as xxhash from "../../dep/xxhash.ts";
import * as path from "../../dep/std/path.ts";
import * as fs from "../../dep/std/fs.ts";

import { Plugin } from "../Plugin.ts";
import { log } from "../log.ts";
import { Asset } from "../AssetCollector.ts";

type SvgOptions = {
    outdir: string;
    filter: RegExp;
};

export function svg(
    { outdir = "svg/", filter = /\.svg$/ }: Partial<SvgOptions> = {},
): Plugin {
    return (frugal) => {
        return {
            name: "frugal:svg",
            setup(build) {
                build.onResolve({ filter }, (args) => {
                    return { path: args.path };
                });

                build.onLoad({ filter }, async (args) => {
                    const url = frugal.url(args);

                    const { id, viewBox, basename } = await symbolUrl(path.fromFileUrl(url));

                    log(
                        `found svg symbol "${
                            path.relative(
                                path.fromFileUrl(
                                    new URL(".", frugal.config.self),
                                ),
                                path.fromFileUrl(url),
                            )
                        }"`,
                        {
                            level: "debug",
                            scope: "frugal:svg",
                        },
                    );

                    return {
                        contents: JSON.stringify({ href: `/${outdir}${basename}#${id}`, viewBox }),
                        loader: "json",
                    };
                });

                build.onEnd(async (result) => {
                    const metafile = result.metafile;
                    const errors = result.errors;

                    if (errors.length !== 0 || metafile === undefined) {
                        return;
                    }

                    const assets = frugal.collect(filter, metafile);

                    const spritesheets: Record<string, Symbol[]> = {};

                    await Promise.all(assets.map(async (asset) => {
                        const { spritesheet, symbol } = await symbolFrom(asset);
                        spritesheets[spritesheet] = spritesheets[spritesheet] ?? [];
                        spritesheets[spritesheet].push(symbol);
                    }));

                    const generated = [];

                    for (const [name, symbols] of Object.entries(spritesheets)) {
                        const svg = renderSpritesheet(symbols, frugal.config);
                        const svgPath = path.join("svg", name);
                        const svgUrl = new URL(svgPath, frugal.config.publicdir);
                        const assetPath = `/${svgPath}`;

                        generated.push(assetPath);

                        await fs.ensureFile(svgUrl);
                        await Deno.writeTextFile(svgUrl, svg);
                        const stat = await Deno.stat(svgUrl);

                        frugal.config.budget.add({
                            size: stat.size,
                            type: "images",
                            assetPath,
                        });
                    }

                    frugal.output("svg", generated);
                });
            },
        };
    };
}

async function symbolUrl(svgPath: string) {
    const svgString = await Deno.readTextFile(svgPath);
    const svgHash = (await xxhash.create()).update(svgString)
        .digest("hex");

    const doc = new dom.DOMParser().parseFromString(svgString, "text/html")!;
    const svg = doc.querySelector("svg")!;
    const viewBox = svg.getAttribute("viewBox");
    const width = svg.getAttribute("width");
    const height = svg.getAttribute("height");

    const id = `${path.basename(svgPath, path.extname(svgPath))}-${svgHash}`;
    const spritesheet = path.basename(path.dirname(svgPath));

    return {
        id,
        viewBox: viewBox ?? `0 0 ${width} ${height}`,
        basename: `${spritesheet}.svg`,
    };
}

import * as dom from "../../dep/deno_dom.ts";
import { FrugalConfig } from "../Config.ts";

type Symbol = {
    attributes: Record<string, string>;
    gatheredIds: string[];
    defs?: string;
    content?: string;
    path: string;
};

async function symbolFrom(asset: Asset) {
    const assetPath = path.fromFileUrl(asset.url);
    const svgString = await Deno.readTextFile(assetPath);

    const { id, basename } = await symbolUrl(assetPath);

    const doc = new dom.DOMParser().parseFromString(svgString, "text/html")!;

    const svg = doc.querySelector("svg")!;
    const svgAttributes: Record<string, string> = {};
    for (let i = 0; i < svg.attributes.length; i++) {
        const attribute = svg.attributes.item(i)!;
        svgAttributes[attribute.name] = attribute.value;
    }

    const symbol: Symbol = {
        attributes: svgAttributes,
        gatheredIds: [],
        path: assetPath,
    };
    symbol.attributes["id"] = id;

    svg.querySelectorAll("[id]").forEach((node) => {
        if (isElement(node)) {
            symbol.gatheredIds.push(node.id);
        }
    });

    const defs = svg.querySelector("defs");
    if (defs && defs.children.length !== 0) {
        symbol.defs = defs?.innerHTML.trim();
    }
    defs?.remove();

    symbol.content = svg.innerHTML.trim();

    return { spritesheet: basename, symbol };
}

function renderSpritesheet(symbols: Symbol[], config: FrugalConfig) {
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
            ["id", "viewbox", "preserveaspectratio"]
                .includes(key.toLowerCase())
        ).map(([key, value]) => `${key}="${value}"`).join(
            " ",
        );

        svgContent.push(
            `<symbol ${symbolAttributes}>${symbol.content}</symbol><use href="#${symbol.attributes["id"]}" />`,
        );
    }

    for (const [id, paths] of Object.entries(seenId)) {
        if (paths.length > 1) {
            log(
                `found the same id "${id}" in multiple symbols : ${
                    paths.map((conflictPath) =>
                        path.relative(
                            path.fromFileUrl(
                                new URL(".", config.self),
                            ),
                            conflictPath,
                        )
                    ).join(", ")
                }`,
                { scope: "plugin:svg", level: "warning" },
            );
        }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg">${defs.length !== 0 ? `<defs>${defs.join("\n")}</defs>` : ""}${
        svgContent.join("\n")
    }</svg>`;
}

function isElement(node: dom.Node): node is dom.Element {
    return node.nodeType === Node.ELEMENT_NODE;
}
