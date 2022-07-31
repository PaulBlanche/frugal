export type PathObject<PATH extends string> = Collapse<
    Consume<{ rest: PATH; object: unknown; index: [] }>['object']
>;

type Consume<
    CONTEXT extends ContextBase,
> = CONTEXT['rest'] extends `${infer CHAR}${infer REST}`
    ? CONTEXT['escape'] extends true ? Consume<
            { rest: REST; index: CONTEXT['index']; object: CONTEXT['object'] }
        >
    : CHAR extends ':' ? Consume<ConsumeNamedParameter<CONTEXT>>
    : CHAR extends '(' ? Consume<ConsumeUnnamedParameter<CONTEXT>>
    : CHAR extends '{' ? REST extends `${infer PARAM}}${infer REST}` ? Consume<
                {
                    rest: `${PARAM}${REST}`;
                    index: CONTEXT['index'];
                    object: CONTEXT['object'];
                }
            >
        : Consume<
            { rest: REST; index: CONTEXT['index']; object: CONTEXT['object'] }
        >
    : CHAR extends '\\' ? Consume<
            {
                rest: REST;
                index: CONTEXT['index'];
                object: CONTEXT['object'];
                escape: true;
            }
        >
    : Consume<
        { rest: REST; index: CONTEXT['index']; object: CONTEXT['object'] }
    >
    : { rest: ''; index: CONTEXT['index']; object: CONTEXT['object'] };

type ConsumeNamedParameter<
    CONTEXT extends ContextBase,
> = ConsumeModifier<
    ConsumePattern<
        ConsumeParameterName<{ rest: CONTEXT['rest']; index: CONTEXT['index'] }>
    >
> extends {
    name: infer NAME;
    optionnal?: infer OPTIONNAL;
    rest: infer REST;
    index: infer INDEX;
} ? NAME extends string | number ? {
            object:
                & CONTEXT['object']
                & (OPTIONNAL extends true ? { [key in NAME]?: string }
                    : { [key in NAME]: string });
            rest: REST;
            index: INDEX;
        }
    : never
    : never;

type ConsumeUnnamedParameter<
    CONTEXT extends ContextBase,
> = ConsumeModifier<ConsumePattern<CONTEXT>> extends {
    name: infer NAME;
    optionnal?: infer OPTIONNAL;
    rest: infer REST;
    index: infer INDEX;
} ? NAME extends string | number ? {
            object:
                & CONTEXT['object']
                & (OPTIONNAL extends true ? { [key in NAME]?: string }
                    : { [key in NAME]: string });
            rest: REST;
            index: INDEX;
        }
    : never
    : CONTEXT['rest'] extends `(${infer REST}`
        ? { object: CONTEXT['object']; index: CONTEXT['index']; rest: REST }
    : { object: CONTEXT['object']; index: CONTEXT['index']; rest: '' };

type ParameterContextBase = {
    rest: string;
    name?: string | number;
    optionnal?: true;
    index: unknown[];
};

type ConsumeModifier<INPUT extends ParameterContextBase> = INPUT['rest'] extends
    `?${infer REST}` ? {
        name: INPUT['name'];
        index: INPUT['index'];
        optionnal: true;
        rest: REST;
    }
    : INPUT['rest'] extends `*${infer REST}` ? {
            name: INPUT['name'];
            index: INPUT['index'];
            optionnal: true;
            rest: REST;
        }
    : INPUT;

type ConsumePattern<
    INPUT extends ParameterContextBase,
> = INPUT['rest'] extends `(${infer _PATTERN})${infer REST}`
    ? INPUT['name'] extends string ? {
            name: INPUT['name'];
            rest: REST;
            index: INPUT['index'];
        }
    : {
        name: INPUT['index']['length'];
        rest: REST;
        index: [...INPUT['index'], 0];
    }
    : INPUT;

type ConsumeParameterName<INPUT extends ParameterContextBase> =
    INPUT['rest'] extends `:${infer REST}` ? {
            index: INPUT['index'];
            name: ConsumeWord<REST>['word'];
            rest: ConsumeWord<REST>['rest'];
        }
        : never;

type ConsumeWord<INPUT extends string, WORD extends string = ''> =
    Lowercase<INPUT> extends `${infer CHAR}${infer REST}`
        ? CHAR extends 'a' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'b' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'c' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'd' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'e' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'f' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'g' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'h' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'i' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'j' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'k' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'l' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'm' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'n' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'o' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'p' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'q' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'r' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 's' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 't' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'u' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'v' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'w' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'x' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'y' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends 'z' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '0' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '1' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '2' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '3' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '4' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '5' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '6' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '7' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '8' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '9' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '-' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : CHAR extends '_' ? ConsumeWord<REST, `${WORD}${CHAR}`>
        : { word: WORD; rest: INPUT }
        : { word: WORD; rest: INPUT };

type PathObjectBase = Record<string | number, string> | unknown;

type ContextBase = {
    rest: string;
    object: PathObjectBase;
    index: unknown[];
    escape?: true;
};

type Collapse<OBJECT extends PathObjectBase> = {
    [K in keyof OBJECT]: OBJECT[K];
};
