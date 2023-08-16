import * as page from "../../../../mod.ts";

export const strictPaths = false;

export const route = "/static-jit/:slug";

type Data = {
    count: number;
    path: {
        slug: string;
    };
    searchParams: Record<string, string>;
};

export function getPaths(): page.PathList<typeof route> {
    return [{ slug: "1" }];
}

export function generate(
    { path }: page.StaticHandlerContext<typeof route>,
): page.DataResponse<Data> {
    const count = 0;
    return new page.DataResponse({
        path,
        count,
        searchParams: {},
    }, {
        headers: {
            "Content-Type": "application/json",
        },
    });
}

export function GET(
    { path, session, request }: page.DynamicHandlerContext<typeof route>,
): page.DataResponse<Data> {
    const count = session?.get<number>("counter") ?? 0;
    return new page.DataResponse({
        path,
        count,
        searchParams: Object.fromEntries(
            new URL(request.url).searchParams.entries(),
        ),
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
