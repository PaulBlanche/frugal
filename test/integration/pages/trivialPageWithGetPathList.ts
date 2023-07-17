import { PathList } from "../../../page.ts";

export const self = import.meta.url;

export const pattern = "/:foo/:bar";

export function getPaths(): PathList<typeof pattern> {
    return [{ foo: "foo", bar: "bar" }, { foo: "fooz", bar: "baz" }];
}

export function render() {
    return `Hello world`;
}
