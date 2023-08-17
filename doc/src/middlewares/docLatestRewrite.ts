import { Context } from "$dep/frugal/mod.ts";
import { Next } from "$dep/frugal/mod.ts";
import { getToc, latest } from "../pages/doc/toc.ts";

export async function docLatestRewrite(context: Context, next: Next<Context>) {
    const matches = context.request.url.match(/\/doc@latest(:\/(.*))?$/);
    if (matches) {
        const toc = await getToc(context.resolve);
        const redirectUrl = context.request.url.replace("/doc@latest", `/doc@${latest(toc)}`);
        return new Response(undefined, {
            status: 307,
            headers: {
                "Location": redirectUrl,
            },
        });
    }

    return next(context);
}
