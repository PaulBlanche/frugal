import * as http from "../../../../dep/std/http.ts";

import { Next } from "../../Middleware.ts";
import { Context } from "../../Context.ts";
import { CsrfToken } from "./CsrfToken.ts";
import { CsrfValidator } from "./CsrfValidator.ts";

const CSRF_FAIL_KEY = "csrf_fail";

export async function csrf<CONTEXT extends Context>(
    context: CONTEXT,
    next: Next<CONTEXT>,
): Promise<Response> {
    if (context.config.server.csrf === undefined) {
        context.log("abort csrf because there is no csrf config. Yield", {
            scope: "csrf",
            level: "debug",
        });
        return next(context);
    }

    if (context.session === undefined) {
        context.log("abort csrf because there is no session. Yield", {
            scope: "csrf",
            level: "debug",
        });
        return next(context);
    }

    const csrfValidator = new CsrfValidator(context.session, context.config);
    const csrfToken = new CsrfToken(context.session, context.config);

    let response;
    if (context.session.has(CSRF_FAIL_KEY)) {
        context.session.delete(CSRF_FAIL_KEY);
        response = new Response(null, {
            status: http.Status.Forbidden,
            statusText: http.STATUS_TEXT[http.Status.Forbidden],
        });
    } else {
        const isValid = await csrfValidator.validate(context.request);
        if (!isValid) {
            context.log("invalid csrf, redirect to fail page (prg style)", {
                scope: "csrf",
                level: "debug",
            });

            context.session.set(CSRF_FAIL_KEY, "");
            response = new Response(null, {
                status: http.Status.SeeOther,
                statusText: http.STATUS_TEXT[http.Status.SeeOther],
                headers: {
                    "Location": context.request.url,
                },
            });
        } else {
            context.log("valid csrf. Yield", {
                scope: "csrf",
                level: "debug",
            });

            context.state.csrf = csrfToken.maskedValue;
            response = await next(context);
        }
    }

    csrfToken.attach(response);

    return response;
}
