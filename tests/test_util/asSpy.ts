import { assertSpyCall, assertSpyCalls, Spy } from '../../dep/std/mock.ts';

export function asSpy<
    SELF = any, 
    ARGS extends unknown[] = any[], 
    RETURN = any
>(f:(...args:ARGS) => RETURN): Spy<SELF, ARGS, RETURN> {
    return f as unknown as Spy<SELF, ARGS, RETURN>
}