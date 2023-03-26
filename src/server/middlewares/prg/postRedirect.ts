import * as http from '../../../../dep/std/http.ts';
import { Route } from '../../../page/Router.ts';

import { Next } from '../../types.ts';
import { RouteContext } from '../RouteContext.ts';

import { SESSION_KEY } from './const.ts';

const METHODS = [
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
];

export async function postRedirect<ROUTE extends Route>(
    context: RouteContext<ROUTE>,
    next: Next<RouteContext<ROUTE>>,
) {
    const url = new URL(context.request.url);

    const method = context.request.method;
    if (!METHODS.includes(method)) {
        context.log(
            `middleware can't handle ${method}, only handle ${METHODS}. Yield to next middleware`,
            { kind: 'debug', scope: 'prg.postRedirect' },
        );
        return next(context);
    }

    const response = await context.route.generator.generate(
        context.request,
        context.state,
    );

    if (!context.session) {
        context.log(
            `abort PRG because there is no session. Yield to next middleware`,
            { kind: 'debug', scope: 'prg.postRedirect' },
        );

        return response.toResponse();
    }

    if (response.body === undefined) {
        context.log(`abort PRG because page generated an empty response`, {
            kind: 'debug',
            scope: 'prg.postRedirect',
        });

        return response.toResponse();
    }

    context.session.shouldAttach();

    const persistenceStore = context.session.store('persistence');
    const tokenStore = context.session.store('token');

    await persistenceStore.set(
        SESSION_KEY,
        JSON.stringify(response.serialize()),
    );
    tokenStore.set(SESSION_KEY, '');

    context.log(`serve Redirect`, { kind: 'debug', scope: 'prg.postRedirect' });

    const headers = new Headers({
        'Location': url.href,
    });

    return new Response(null, {
        status: http.Status.SeeOther,
        statusText: http.STATUS_TEXT[http.Status.SeeOther],
        headers,
    });
}
