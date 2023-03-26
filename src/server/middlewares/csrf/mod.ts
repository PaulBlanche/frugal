import * as http from '../../../../dep/std/http.ts';

import { Next } from '../../types.ts';
import { Context } from '../../Context.ts';
import { CsrfToken } from './CsrfToken.ts';
import { CsrfValidator } from './CsrfValidator.ts';

const SESSION_KEY = 'csrf_fail';

export async function csrf<CONTEXT extends Context>(
    context: CONTEXT,
    next: Next<CONTEXT>,
): Promise<Response> {
    if (context.config.server.csrf === undefined) {
        context.log('abort csrf because there is no csrf config. Yield', {
            scope: 'csrf',
            kind: 'debug',
        });
        return next(context);
    }

    if (context.session === undefined) {
        context.log('abort csrf because there is no session. Yield', {
            scope: 'csrf',
            kind: 'debug',
        });
        return next(context);
    }

    const csrfValidator = new CsrfValidator(context.config, context.session);
    const csrfToken = new CsrfToken(context.session, context.config);

    const tokenStore = context.session.store('token');

    let response;
    if (tokenStore.has(SESSION_KEY)) {
        tokenStore.unset(SESSION_KEY);
        response = new Response(null, {
            status: http.Status.Forbidden,
            statusText: http.STATUS_TEXT[http.Status.Forbidden],
        });
    } else {
        const isValid = await csrfValidator.validate(context.request);
        if (!isValid) {
            context.log('invalid csrf, redirect to fail page (prg style)', {
                scope: 'csrf',
                kind: 'debug',
            });

            tokenStore.set(SESSION_KEY, '');
            response = new Response(null, {
                status: http.Status.SeeOther,
                statusText: http.STATUS_TEXT[http.Status.SeeOther],
                headers: {
                    'Location': context.request.url,
                },
            });
        } else {
            context.log('valid csrf. Yield', {
                scope: 'csrf',
                kind: 'debug',
            });

            context.state.csrf = csrfToken.value;
            response = await next(context);
        }
    }

    csrfToken.attach(response);

    return response;
}
