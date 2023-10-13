import { Route } from "../../../page/Router.js";
import { Context } from "../../Context.js";

export type RouteContext<ROUTE extends Route = Route> = Context & {
    route: ROUTE;
};
