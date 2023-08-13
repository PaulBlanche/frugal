import { PathList } from "../../../../page.ts";

export const route = "/:foo/:bar";

export function getPaths(): PathList<typeof route> {
    return [{ foo: "foo", bar: "bar" }, { foo: "fooz", bar: "baz" }];
}

export function render() {
    return `Hello world`;
}
