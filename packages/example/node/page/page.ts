import * as frugal from "frugal";
import * as fs from "node:fs";

// script and styles dont need to be directly imported by the page. Here they are transitive dependencies (imported via the `./dep.ts` module)
import "./dep.ts";
import test2 from "./test2.module.css";

export const route = "/entry/:id";

// we will build only a subset of possible paths, and allow other paths to be built just in time.
export const strictPaths = false;

type Data = {
    id: string;
    content: string;
};

export async function getPaths(
    args: frugal.GetPathsParams,
): Promise<frugal.PathList<typeof route>> {
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
        <script type="module" src="${context.assets.get("script")[0]}"></script>
        <link rel="stylesheet" href="${context.assets.get("style")[0]}"></link>
    </head>
    <body>
        <h1>My Page</h1>
        <p class="${test2["red"]}">id: ${context.data.id}</p>
        <p>content : ${context.data.content}</p>
        <p>process : ${process.execPath}</p>
    </body>
</html>`;
}

async function getData(path: string): Promise<Record<string, string>> {
    return JSON.parse(await fs.promises.readFile(path, { encoding: "utf-8" }));
}
