import { Context } from "../Context.ts";
import { Next } from "../Middleware.ts";

export function trailingSlashRedirect(context: Context, next: Next<Context>) {
    const url = new URL(context.request.url);
    if (url.pathname.endsWith("/") && url.pathname !== "/") {
        return new Response(undefined, {
            status: 301,
            headers: {
                "Location": url.pathname.slice(0, -1),
            },
        });
    }

    return next(context);
}
