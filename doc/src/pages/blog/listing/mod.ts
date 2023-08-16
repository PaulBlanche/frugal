import { DataResponse, StaticHandlerContext } from "$dep/frugal/mod.ts";
import { getRenderFrom } from "$dep/frugal/runtime/preact.server.ts";
import { splash } from "../splash.ts";
import { Page } from "./Page.tsx";
import { getToc } from "../toc.ts";
import { Data } from "./type.ts";

export const route = "/blog";

export async function generate({ resolve, publicdir }: StaticHandlerContext<typeof route>) {
    const toc = await getToc(resolve);

    return new DataResponse<Data>({
        entries: await Promise.all(
            toc.map(async (entry) => ({
                ...entry,
                splash: await splash(resolve(entry.splash), publicdir),
            })),
        ),
    }, {
        headers: {
            "Cache-Control": "public, max-age=300, must-revalidate", // cached for 5min
        },
    });
}

export const render = getRenderFrom(Page);
