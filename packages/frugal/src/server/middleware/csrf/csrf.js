import * as middleware from "../../Middleware.js";
import * as context from "../../Context.js";
import { CsrfToken } from "./CsrfToken.js";
import { CsrfValidator } from "./CsrfValidator.js";

const CSRF_FAIL_KEY = "csrf_fail";

/**
 * @template {context.Context} CONTEXT
 * @param {CONTEXT} context
 * @param {middleware.Next<CONTEXT>} next
 * @returns {Promise<Response>}
 */
export async function csrf(context, next) {
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
            status: 403,
        });
    } else {
        const isValid = await csrfValidator.validate(context.request);
        if (!isValid) {
            context.log("invalid csrf, redirect to fail page (post-redirect-get style)", {
                scope: "csrf",
                level: "debug",
            });

            context.session.set(CSRF_FAIL_KEY, "");
            response = new Response(null, {
                status: 303,
                headers: {
                    Location: context.request.url,
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
