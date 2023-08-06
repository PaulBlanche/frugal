import * as page from "../../../page.ts";
import "./dep.ts";

export const pattern = "/toto/:id/tata";

export const generateJIT = true;

type Data = {
    id: string;
    content: string;
};

let DATA_CACHE: Record<string, string>;
async function getData(): Promise<Record<string, string>> {
    if (DATA_CACHE === undefined) {
        DATA_CACHE = JSON.parse(
            await Deno.readTextFile("/home/whiteshoulders/perso/frugal/exemple/basic/page/data.json"),
        );
    }
    return DATA_CACHE;
}

export async function getPaths(): Promise<page.PathList<typeof pattern>> {
    const data = await getData();
    return Object.keys(data).map((id) => ({ id }));
}

export async function generate(args: page.StaticHandlerContext<typeof pattern>) {
    const data = await getData();
    return new page.PageResponse<Data>({
        data: {
            id: args.path.id,
            content: data[args.path.id],
        },
    });
}

export function render(context: page.RenderContext<typeof pattern, Data>) {
    console.log("render", context);
    return `<body>econtent : ${context.data.content} (${context.data.id})<script src="${
        context.assets["script"][context.descriptor]
    }"></script></body>`;
}
