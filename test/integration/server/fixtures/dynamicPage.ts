import * as page from "../../../../mod.ts";

export const type = "dynamic";

export const route = "/dynamic/:slug";

type Data = {
    count: number;
    path: {
        slug: string;
    };
    searchParams: Record<string, string>;
};

export function GET({ path, request, session }: page.DynamicHandlerContext<typeof route>): page.DataResponse<Data> {
    const count = session?.get<number>("counter") ?? 0;
    session?.set("counter", count + 1);
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

export function render({ data }: page.RenderContext<typeof route, Data>) {
    return JSON.stringify(data);
}
