import { DataResponse, EmptyResponse, GetPathsParams, PathList, StaticHandlerContext } from "$dep/frugal/page.ts";
import { getRenderFrom } from "$dep/frugal/runtime/preact.server.ts";
import { splash } from "../splash.ts";
import { Page } from "./Page.tsx";
import { getToc } from "../toc.ts";
import { Data } from "./type.ts";

export const pattern = "/blog/:slug";

export async function getPaths({ resolve }: GetPathsParams): Promise<PathList<typeof pattern>> {
    const toc = await getToc(resolve);

    return toc.map((entry) => ({ slug: entry.slug }));
}

export async function generate(
    { path: { slug }, resolve, publicdir }: StaticHandlerContext<typeof pattern>,
) {
    const toc = await getToc(resolve);

    const entry = toc.find((entry) => entry.slug === slug);

    if (entry === undefined || entry.file === undefined) {
        return new EmptyResponse({ status: 404 });
    }

    const markdown = await Deno.readTextFile(resolve(`./src/contents/blog/${entry.file}`));

    return new DataResponse<Data>({
        data: {
            ...entry,
            splash: await splash(resolve(entry.splash), publicdir),
            markdown,
        },
        headers: {
            "Cache-Control": "public, max-age=300, must-revalidate", // cached for 5min
        },
    });
}

export const render = getRenderFrom(Page);
