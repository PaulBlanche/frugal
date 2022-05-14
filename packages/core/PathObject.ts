export type PathObject<PATH extends string> = PathToObject<
    NormalizedPath<PATH>
> extends [
    // deno-lint-ignore no-explicit-any
    any,
    infer T,
] ? T
    : never;

type NormalizedPath<PATH extends string> = PATH extends
    `${infer _PREFIX}:${infer REST}` ? `:${REST}` : PATH;

type PathToObject<
    PATH extends string,
    // deno-lint-ignore no-explicit-any
    INDEX extends any[] = [],
    // deno-lint-ignore ban-types
    OBJECT = {},
> = PATH extends `:${infer SEGMENT}:${infer REST}` ? PathToObject<
    `:${REST}`,
    ParameterToObject<SEGMENT, INDEX, OBJECT>[0],
    ParameterToObject<SEGMENT, INDEX, OBJECT>[1]
>
    : PATH extends `:${infer SEGMENT}`
        ? ParameterToObject<SEGMENT, INDEX, OBJECT>
    : OBJECT;

// deno-lint-ignore no-explicit-any
type ParameterToObject<PARAMETER extends string, INDEX extends any[], OBJECT> =
    [
        ParameterName<PARAMETER, INDEX>[1],
        & OBJECT
        & (PARAMETER extends `${infer _BEFORE}?${infer AFTER}`
            ? HasClosingParens<AFTER> extends false
                ? { [s in ParameterName<PARAMETER, INDEX>[0]]?: string }
            : { [s in ParameterName<PARAMETER, INDEX>[0]]: string }
            : { [s in ParameterName<PARAMETER, INDEX>[0]]: string }),
    ];

type HasClosingParens<STRING extends string> = STRING extends
    `${infer CHAR}${infer REST}`
    ? CHAR extends ')' ? true : HasClosingParens<REST>
    : false;

// deno-lint-ignore no-explicit-any
type ParameterName<SEGMENT extends string, INDEX extends any[]> =
    FirstWord<SEGMENT> extends '' ? [INDEX['length'], [...INDEX, 0]]
        : [FirstWord<SEGMENT>, INDEX];

type FirstWord<SEGMENT extends string, WORD extends string = ''> =
    Lowercase<SEGMENT> extends `${infer CHAR}${infer REST}`
        ? CHAR extends 'a' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'b' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'c' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'd' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'e' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'f' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'g' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'h' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'i' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'j' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'k' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'l' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'm' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'n' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'o' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'p' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'q' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'r' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 's' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 't' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'u' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'v' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'w' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'x' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'y' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'z' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '0' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '1' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '2' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '3' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '4' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '5' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '6' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '7' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '8' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '9' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '-' ? FirstWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '_' ? FirstWord<REST, `${WORD}${CHAR}`>
        : WORD
        : WORD;
