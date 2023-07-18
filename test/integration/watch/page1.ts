import { DataResponse, RenderContext, StaticHandlerContext } from "../../../page.ts";
import { store } from "./store.ts";

export const self = import.meta.url;

export const pattern = "/page1/:id";

export function getPaths() {
    return [{ id: "1" }, { id: "2" }];
}

export async function generate({ path }: StaticHandlerContext<typeof pattern>) {
    const dataStore = await store();
    const pageData = dataStore[0];
    return new DataResponse({
        data: pageData[path.id].data,
        headers: pageData[path.id].headers,
    });
}

export function render({ data, path }: RenderContext<typeof pattern, number>) {
    return `data : ${data}, path: ${JSON.stringify(path)}`;
}
