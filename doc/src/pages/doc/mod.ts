import { DataResponse, EmptyResponse, GetPathsParams, PathList, StaticHandlerContext } from "$dep/frugal/page.ts";
import { getRenderFrom } from "$dep/frugal/runtime/preact.server.ts";
import { Page } from "./Page.tsx";
import { getToc } from "../../toc.ts";
import { Data } from "./type.ts";

import versions from "../../../../versions.json" assert { type: "json" };

export const pattern = "/doc@:version/:slug(.*)?";

export async function getPaths({ resolve }: GetPathsParams): Promise<PathList<typeof pattern>> {
    const nestedPaths = await Promise.all(versions.map(async (version) => {
        const toc = await getToc(version, resolve);

        return [
            ...toc.entries.filter((entry) => entry.file !== undefined).map((entry) => ({
                slug: entry.slug,
                version,
            })),
            {
                slug: undefined,
                version,
            },
        ];
    }));

    return nestedPaths.flat();
}

export async function generate(
    { path: { slug = "introduction", version }, resolve }: StaticHandlerContext<typeof pattern>,
) {
    const toc = await getToc(version, resolve);

    const entry = toc.entries.find((entry) => entry.slug === slug);

    if (entry === undefined || entry.file === undefined) {
        return new EmptyResponse({ status: 404 });
    }

    const markdown = await Deno.readTextFile(resolve(`./src/contents/doc/${entry.file}`));

    return new DataResponse<Data>({
        data: {
            toc,
            markdown,
        },
        headers: {
            "Cache-Control": "public, max-age=300, must-revalidate", // cached for 5min
        },
    });
}

export const render = getRenderFrom(Page);
