import { Route } from "../../page/Router.ts";
import { Context } from "../Context.ts";

export type RouteContext<ROUTE extends Route = Route> =
    & Context
    & {
        route: ROUTE;
    };
