import * as http from '../../../../dep/std/http.ts';

import { Next } from '../../types.ts';
import { RouterContext } from '../types.ts';
import { CsrfToken } from './CsrfToken.ts';
import { CsrfValidator } from './CsrfValidator.ts';

export async function csrfMiddleware(
    context: RouterContext,
    next: Next<RouterContext>,
): Promise<Response> {
    if (context.config.csrf === undefined) {
        return next(context);
    }

    const csrfValidator = new CsrfValidator(context);
    const csrfToken = new CsrfToken(context);

    let response;
    if (context.session.has('CSRF_FAIL')) {
        context.session.unset('CSRF_FAIL');
        response = new Response(null, {
            status: http.Status.Forbidden,
            statusText: http.STATUS_TEXT[http.Status.Forbidden],
        });
    } else {
        const isValid = await csrfValidator.validate();
        if (!isValid) {
            context.session.set('CSRF_FAIL', '');
            response = new Response(null, {
                status: http.Status.SeeOther,
                statusText: http.STATUS_TEXT[http.Status.SeeOther],
                headers: {
                    'Location': context.request.url,
                },
            });
        } else {
            context.state.csrf = csrfToken.value;
            response = await next(context);
        }
    }

    csrfToken.attach(response);

    return response;
}
