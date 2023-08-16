import { DataResponse, EmptyResponse, GetPathsParams, PathList, StaticHandlerContext } from "$dep/frugal/mod.ts";
import { getRenderFrom } from "$dep/frugal/runtime/preact.server.ts";
import { Page } from "./Page.tsx";
import { getToc } from "./toc.ts";
import { Data } from "./type.ts";

export const route = "/doc@:version/:slug(.*)?";

export async function getPaths({ resolve }: GetPathsParams): Promise<PathList<typeof route>> {
    const toc = await getToc(resolve);

    return Object.values(toc).flatMap((tocVersion) => {
        return [
            ...tocVersion.entries.filter((entry) => entry.file !== undefined).map((entry) => ({
                slug: entry.slug,
                version: tocVersion.version,
            })),
            {
                slug: undefined,
                version: tocVersion.version,
            },
        ];
    });
}

export async function generate(
    { path: { slug = "introduction", version }, resolve }: StaticHandlerContext<typeof route>,
) {
    const toc = await getToc(resolve);

    const entry = toc[version].entries.find((entry) => entry.slug === slug);

    if (entry === undefined || entry.file === undefined) {
        return new EmptyResponse({ status: 404 });
    }

    const markdown = await Deno.readTextFile(resolve(`./src/contents/doc/${entry.file}`));

    return new DataResponse<Data>({
        toc,
        version,
        markdown,
    }, {
        headers: {
            "Cache-Control": "public, max-age=300, must-revalidate", // cached for 5min
        },
    });
}

export const render = getRenderFrom(Page);
