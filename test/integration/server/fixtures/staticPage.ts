import * as page from "../../../../page.ts";
import { store } from "./store.ts";

export const pattern = "/static/:slug";

type Data = {
    count: number;
    path: {
        slug: string;
    };
    store: string;
    searchParams: Record<string, string>;
};

export function getPaths(): page.PathList<typeof pattern> {
    return [{ slug: "1" }];
}

export async function generate(
    { path }: page.StaticHandlerContext<typeof pattern>,
): Promise<page.DataResponse<Data>> {
    const count = 0;
    return new page.DataResponse({
        data: {
            path,
            count,
            searchParams: {},
            store: await store(),
        },
        headers: {
            "Content-Type": "application/json",
        },
    });
}

export async function GET(
    { path, session, request }: page.DynamicHandlerContext<typeof pattern>,
): Promise<page.DataResponse<Data>> {
    const count = session?.get<number>("counter") ?? 0;
    return new page.DataResponse({
        data: {
            path,
            count,
            store: await store(),
            searchParams: Object.fromEntries(
                new URL(request.url).searchParams.entries(),
            ),
        },
        headers: {
            "Content-Type": "application/json",
        },
    });
}

export function POST({ request, session }: page.DynamicHandlerContext<typeof pattern>): page.EmptyResponse {
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

export function render({ data }: page.RenderContext<typeof pattern, Data>) {
    return JSON.stringify(data);
}
