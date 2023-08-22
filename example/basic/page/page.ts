import * as frugal from "../../../mod.ts";

// script and styles dont need to be directly imported by the page. Here they are transitive dependencies (imported via the `./dep.ts` module)
import "./dep.ts";

export const route = "/entry/:id";

// we will build only a subset of possible paths, and allow other paths to be built just in time.
export const strictPaths = false;

type Data = {
    id: string;
    content: string;
};

export async function getPaths(args: frugal.GetPathsParams): Promise<frugal.PathList<typeof route>> {
    const data = await getData(args.resolve("page/data.json"));
    return Object.keys(data).map((id) => ({ id }));
}

export async function generate(args: frugal.StaticHandlerContext<typeof route>) {
    const data = await getData(args.resolve("page/data.json"));
    return new frugal.DataResponse<Data>({
        id: args.path.id,
        content: data[args.path.id],
    });
}

export function render(context: frugal.RenderContext<typeof route, Data>) {
    return `<!DOCTYPE html>
<html>
    <head>
        <script src="${context.assets.get("script")[0]}"></script>
        <link rel="stylesheet" href="${context.assets.get("style")[0]}"></link>
    </head>
    <body>
        <h1>My Page</h1>
        id: ${context.data.id}
        content : ${context.data.content}
    </body>
</html>`;
}

// utility function to read the `data.json` file
let DATA_CACHE: Record<string, string>;
async function getData(path: string): Promise<Record<string, string>> {
    if (DATA_CACHE === undefined) {
        DATA_CACHE = JSON.parse(
            await Deno.readTextFile(path),
        );
    }
    return DATA_CACHE;
}
