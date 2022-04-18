import { Context } from '../../dep/oak.ts';
import { PageBuilder, PageGenerator, PageRefresher } from '../core/mod.ts';

export type StaticContext = Context & {
    // deno-lint-ignore no-explicit-any
    refresher?: PageRefresher<any, any, any>;
    // deno-lint-ignore no-explicit-any
    builder?: PageBuilder<any, any, any>;
    // deno-lint-ignore no-explicit-any
    generator?: PageGenerator<any, any, any>;
};

export type DynamicContext = Context & {
    // deno-lint-ignore no-explicit-any
    generator?: PageGenerator<any, any, any>;
};

export type FrugalContext = DynamicContext | StaticContext;
