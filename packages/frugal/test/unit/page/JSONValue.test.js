import { test } from "node:test";
import * as assert from "node:assert/strict";

import { hashableJsonValue } from "../../../src/page/JSONValue.js";

test("#JSONValue: hashable value", () => {
    assert.deepEqual(
        hashableJsonValue({ bar: "bar", foo: 1 }),
        hashableJsonValue({ foo: 1, bar: "bar" }),
        "object key order should not matter",
    );

    assert.notDeepEqual(
        hashableJsonValue({ bar: "bar", foo: true }),
        hashableJsonValue([
            ["bar", "bar"],
            ["foo", true],
        ]),
        "object should be different from keyvalue array",
    );

    assert.deepEqual(
        hashableJsonValue({ bar: [{ quux: [true], baz: 1 }], foo: "foo" }),
        hashableJsonValue({ foo: "foo", bar: [{ baz: 1, quux: [true] }] }),
        "should handle nested object and arrays",
    );
});
