import { DataResponse, RenderContext, StaticHandlerContext } from "../../../../mod.ts";
import { store } from "./store.ts";

export const route = "/page2/:id";

export function getPaths() {
    return [{ id: "1" }, { id: "2" }];
}

export async function generate({ path }: StaticHandlerContext<typeof route>) {
    const dataStore = await store();
    const pageData = dataStore[1];
    return new DataResponse(pageData[path.id].data, {
        headers: pageData[path.id].headers,
    });
}

export function render({ data, path }: RenderContext<typeof route, number>) {
    return `data : ${data}, path: ${JSON.stringify(path)}`;
}
