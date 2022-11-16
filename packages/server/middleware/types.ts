import * as http from '../../../dep/std/http.ts';

import * as frugal from '../../core/mod.ts';

import { CleanConfig } from '../Config.ts';
import { Session } from '../Session.ts';

export type Context = {
    request: Request;
    connInfo: http.ConnInfo;
    state: Record<string, unknown>;
};

export type FrugalContext = Context & {
    config: CleanConfig;
    frugal: frugal.Frugal;
    session: Session;
};

export type RouterContext<ROUTE extends frugal.Route = frugal.Route> =
    & FrugalContext
    & {
        route: ROUTE;
    };
