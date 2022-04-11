import { Context } from '../../dep/oak.ts';
import { PageBuilder, PageGenerator, PageRefresher } from '../core/mod.ts';

export type StaticContext = Context & {
    refresher?: PageRefresher<any, any, any>;
    builder?: PageBuilder<any, any, any>;
    generator?: PageGenerator<any, any, any>;
};

export type DynamicContext = Context & {
    generator?: PageGenerator<any, any, any>;
};

export type FrugalContext = DynamicContext | StaticContext;
