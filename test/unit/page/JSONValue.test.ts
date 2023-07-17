import * as asserts from "../../../dep/std/testing/asserts.ts";

import { hashableJsonValue } from "../../../src/page/JSONValue.ts";

Deno.test("hashable value", () => {
    asserts.assertEquals(
        hashableJsonValue({ bar: "bar", foo: 1 }),
        hashableJsonValue({ foo: 1, bar: "bar" }),
        "object key order should not matter",
    );

    asserts.assertNotEquals(
        hashableJsonValue({ bar: "bar", foo: true }),
        hashableJsonValue([["bar", "bar"], ["foo", true]]),
        "object should be different from keyvalue array",
    );

    asserts.assertEquals(
        hashableJsonValue({ bar: [{ quux: [true], baz: 1 }], foo: "foo" }),
        hashableJsonValue({ foo: "foo", bar: [{ baz: 1, quux: [true] }] }),
        "should handle nested object and arrays",
    );
});
