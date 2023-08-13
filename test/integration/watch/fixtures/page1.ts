import { DataResponse, RenderContext, StaticHandlerContext } from "../../../../page.ts";
import { store } from "./store.ts";

export const route = "/page1/:id";

export function getPaths() {
    return [{ id: "1" }, { id: "2" }];
}

export async function generate({ path }: StaticHandlerContext<typeof route>) {
    const dataStore = await store();
    const pageData = dataStore[0];
    return new DataResponse({
        data: pageData[path.id].data,
        headers: pageData[path.id].headers,
    });
}

export function render({ data, path }: RenderContext<typeof route, number>) {
    return `data : ${data}, path: ${JSON.stringify(path)}`;
}
