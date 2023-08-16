import { PathList } from "../../../../mod.ts";

export const route = "/:foo/:bar";

export function getPaths(): PathList<typeof route> {
    return [{ foo: "foo", bar: "bar" }, { foo: "fooz", bar: "baz" }];
}

export function render() {
    return `Hello world`;
}
