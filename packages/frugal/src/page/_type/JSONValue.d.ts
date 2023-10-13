export type JSONValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | { [x: string]: JSONValue }
    | JSONValue[];

export type HashableJsonValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | [0, JSONValue[]]
    | [1, [string, JSONValue][]];
