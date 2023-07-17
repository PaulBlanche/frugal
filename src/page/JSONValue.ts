export type JSONValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | { [x: string]: JSONValue }
    | JSONValue[];

type HashableJsonValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | [0, JSONValue[]]
    | [1, [string, JSONValue][]];

export function hashableJsonValue(value: JSONValue): HashableJsonValue {
    if (value === undefined || value === null || typeof value !== "object") {
        return value;
    }
    if (Array.isArray(value)) {
        return [0, value];
    }

    return [
        1,
        Object.keys(value).sort().map((key) => {
            return [key, hashableJsonValue(value[key])] as [string, HashableJsonValue];
        }),
    ];
}
