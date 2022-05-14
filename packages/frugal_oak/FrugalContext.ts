import { Context } from 'oak';
import { PageBuilder, PageGenerator, PageRefresher } from '../core/mod.ts';

export type StaticContext = Context & {
    // deno-lint-ignore no-explicit-any
    refresher?: PageRefresher<any, any>;
    // deno-lint-ignore no-explicit-any
    builder?: PageBuilder<any, any>;
    // deno-lint-ignore no-explicit-any
    generator?: PageGenerator<any, any>;
};

export type DynamicContext = Context & {
    // deno-lint-ignore no-explicit-any
    generator?: PageGenerator<any, any>;
};

export type FrugalContext = DynamicContext | StaticContext;
