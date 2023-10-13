import * as _type from "./_type/JSONValue.js";
export * from "./_type/JSONValue.js";

/**
 * @param {_type.JSONValue} value
 * @returns {_type.HashableJsonValue}
 */
export function hashableJsonValue(value) {
    if (value === undefined || value === null || typeof value !== "object") {
        return value;
    }
    if (Array.isArray(value)) {
        return [0, value];
    }

    return [
        1,
        Object.keys(value)
            .sort()
            .map((key) => {
                return /** @type {[string, _type.HashableJsonValue]} */ ([
                    key,
                    hashableJsonValue(value[key]),
                ]);
            }),
    ];
}
