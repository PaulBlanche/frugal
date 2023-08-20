import * as xxhash from "../../dep/xxhash.ts";
import * as path from "../../dep/std/path.ts";
import * as fs from "../../dep/std/fs.ts";
import * as dom from "../../dep/deno_dom.ts";

import { Plugin } from "../Plugin.ts";
import { log } from "../log.ts";
import { FrugalConfig } from "../Config.ts";

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
                const svgBuilder = new SvgBuilder();

                build.onResolve({ filter }, (args) => {
                    return { path: args.path };
                });

                build.onLoad({ filter }, async (args) => {
                    const url = frugal.url(args);

                    const { meta: { spritesheet, id, viewBox } } = await svgBuilder.symbol(path.fromFileUrl(url));

                    return {
                        contents: JSON.stringify({ href: `/${outdir}${spritesheet}#${id}`, viewBox }),
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
                        const symbol = await svgBuilder.symbol(path.fromFileUrl(asset.url));
                        spritesheets[symbol.meta.spritesheet] = spritesheets[symbol.meta.spritesheet] ?? [];
                        spritesheets[symbol.meta.spritesheet].push(symbol);
                    }));

                    const generated = [];

                    for (const [name, symbols] of Object.entries(spritesheets)) {
                        const svg = svgBuilder.spritesheet(symbols, frugal.config);
                        const hash = (await xxhash.create()).update(svg).digest("hex").toString();
                        const svgPath = path.join("svg", `${name}-${hash}.svg`);
                        const svgUrl = new URL(svgPath, frugal.config.publicdir);
                        const assetPath = `/${svgPath}`;

                        generated.push(assetPath);

                        await fs.ensureFile(svgUrl);
                        await Deno.writeTextFile(svgUrl, svg);
                    }

                    frugal.output("svg", { type: "global", asset: generated });
                });
            },
        };
    };
}

type MetaSymbol = { id: string; viewBox: string; spritesheet: string; path: string };

type SvgSymbol = {
    attributes: Record<string, string>;
    gatheredIds: string[];
    defs?: string;
    content?: string;
};

type Symbol = {
    meta: MetaSymbol;
    svg: SvgSymbol;
};

class SvgBuilder {
    #symbolCache: Map<string, Symbol>;
    #spritesheetCache: Map<string, string>;

    constructor() {
        this.#symbolCache = new Map();
        this.#spritesheetCache = new Map();
    }

    async symbol(svgPath: string) {
        const svgString = await Deno.readTextFile(svgPath);
        const svgHash = (await xxhash.create()).update(svgString)
            .digest("hex").toString();

        const cached = this.#symbolCache.get(svgHash);
        if (cached !== undefined) {
            return cached;
        }

        log(`generating svg symbol from "${svgPath}"`, { level: "debug", scope: "frugal:svg" });

        const doc = new dom.DOMParser().parseFromString(svgString, "text/html")!;
        const svg = doc.querySelector("svg")!;
        const viewBox = svg.getAttribute("viewBox");
        const width = svg.getAttribute("width");
        const height = svg.getAttribute("height");

        const id = `${path.basename(svgPath, path.extname(svgPath))}-${svgHash}`;
        const spritesheet = path.basename(path.dirname(svgPath));

        const metaSymbol: MetaSymbol = {
            id,
            viewBox: viewBox ?? `0 0 ${width} ${height}`,
            spritesheet,
            path: svgPath,
        };

        const svgAttributes: Record<string, string> = {};
        for (let i = 0; i < svg.attributes.length; i++) {
            const attribute = svg.attributes.item(i)!;
            svgAttributes[attribute.name] = attribute.value;
        }

        const svgSymbol: SvgSymbol = {
            attributes: svgAttributes,
            gatheredIds: [],
        };
        svgSymbol.attributes["id"] = id;

        svg.querySelectorAll("[id]").forEach((node) => {
            if (isElement(node)) {
                svgSymbol.gatheredIds.push(node.id);
            }
        });

        const defs = svg.querySelector("defs");
        if (defs && defs.children.length !== 0) {
            svgSymbol.defs = defs?.innerHTML.trim();
        }
        defs?.remove();

        svgSymbol.content = svg.innerHTML.trim();

        const symbol = { svg: svgSymbol, meta: metaSymbol };

        this.#symbolCache.set(svgHash, symbol);

        return symbol;
    }

    spritesheet(symbols: Symbol[], config: FrugalConfig) {
        const id = symbols.map((symbol) => symbol.meta.id).join("/");
        const cached = this.#spritesheetCache.get(id);
        if (cached !== undefined) {
            return cached;
        }

        log(`generating spritesheet "${symbols[0].meta.spritesheet}"`, { level: "debug", scope: "frugal:svg" });

        const seenId: Record<string, Set<string>> = {};
        const svgContent = [];
        const defs = [];
        for (const symbol of symbols) {
            for (const id of symbol.svg.gatheredIds) {
                seenId[id] = seenId[id] ?? new Set();
                seenId[id].add(symbol.meta.path);
            }

            if (symbol.svg.defs) {
                defs.push(symbol.svg.defs);
            }

            const symbolAttributes = Object.entries(
                symbol.svg.attributes,
            ).filter(([key, _]) =>
                ["id", "viewbox", "preserveaspectratio"]
                    .includes(key.toLowerCase())
            ).map(([key, value]) => `${key}="${value}"`).join(
                " ",
            );

            svgContent.push(
                `<symbol ${symbolAttributes}>${symbol.svg.content}</symbol><use href="#${
                    symbol.svg.attributes["id"]
                }" />`,
            );
        }

        for (const [id, paths] of Object.entries(seenId)) {
            if (paths.size > 1) {
                log(
                    `found the same id "${id}" in multiple symbols : ${
                        Array.from(paths.values()).map((conflictPath) =>
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

        const spritesheet = `<svg xmlns="http://www.w3.org/2000/svg">${
            defs.length !== 0 ? `<defs>${defs.join("\n")}</defs>` : ""
        }${svgContent.join("\n")}</svg>`;

        this.#spritesheetCache.set(id, spritesheet);
        return spritesheet;
    }
}

function isElement(node: dom.Node): node is dom.Element {
    return node.nodeType === dom.Node.ELEMENT_NODE;
}
