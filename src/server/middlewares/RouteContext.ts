import { Context } from '../Context.ts';
import { Route } from '../../page/Router.ts';

export type RouteContext<ROUTE extends Route = Route> =
    & Context
    & {
        route: ROUTE;
    };
