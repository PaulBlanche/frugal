import { PageResponse, RenderContext } from "../../../../page.ts";

export const pattern = "/";

type Data = { foo: string };

export function generate() {
    return new PageResponse({
        data: { foo: "bar" },
        status: 204,
        headers: {
            "my-header": "quux",
        },
    });
}

export function render({ data }: RenderContext<typeof pattern, Data>) {
    return `${data.foo}`;
}