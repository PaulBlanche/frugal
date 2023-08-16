import * as page from "../../../../mod.ts";
import { store } from "./store.ts";

export const route = "/static/:slug";

type Data = {
    count: number;
    path: {
        slug: string;
    };
    store: string;
    searchParams: Record<string, string>;
};

export function getPaths(): page.PathList<typeof route> {
    return [{ slug: "1" }];
}

export async function generate(
    { path, session, request }: page.HybridHandlerContext<typeof route>,
): Promise<page.DataResponse<Data>> {
    const count = session?.get<number>("counter") ?? 0;
    return new page.DataResponse({
        path,
        count,
        store: await store(),
        searchParams: request
            ? Object.fromEntries(
                new URL(request.url).searchParams.entries(),
            )
            : {},
    }, {
        headers: {
            "Content-Type": "application/json",
        },
    });
}

export function POST({ request, session }: page.DynamicHandlerContext<typeof route>): page.EmptyResponse {
    const count = session?.get<number>("counter") ?? 0;
    session?.set("counter", count + 1);
    return new page.EmptyResponse({
        forceDynamic: true,
        status: 303,
        headers: {
            Location: request.url,
        },
    });
}

export function render({ data }: page.RenderContext<typeof route, Data>) {
    return JSON.stringify(data);
}
