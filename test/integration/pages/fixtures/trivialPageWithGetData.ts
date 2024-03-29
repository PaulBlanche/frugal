import { DataResponse, RenderContext } from "../../../../mod.ts";

export const route = "/";

type Data = { foo: string };

export function generate() {
    return new DataResponse({ foo: "bar" }, {
        status: 204,
        headers: {
            "my-header": "quux",
        },
    });
}

export function render({ data }: RenderContext<typeof route, Data>) {
    return `${data.foo}`;
}
