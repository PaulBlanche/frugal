import * as http from '../../../../dep/std/http.ts';

import { StaticRoute } from '../../../page/Router.ts';
import { Next } from '../../types.ts';
import { RouteContext } from '../RouteContext.ts';

export async function forceRefresh(
    context: RouteContext<StaticRoute>,
    next: Next<RouteContext<StaticRoute>>,
) {
    const refreshKey = context.config.server.refreshKey;
    if (refreshKey === undefined) {
        context.log(`no refresh key in config. Yield to next middleware`, {
            kind: 'debug',
            scope: 'forceRefresh',
        });

        return next(context);
    }

    const url = new URL(context.request.url);

    const key = url.searchParams.get('force_refresh');
    if (!key) {
        context.log(
            `no refresh key in request. Yield to next middleware`,
            {
                kind: 'debug',
                scope: 'forceRefresh',
            },
        );

        return next(context);
    }

    if (key !== refreshKey) {
        context.log(
            `refresh key in request (${key}) does not match config (${refreshKey}). Yield to next middleware`,
            {
                kind: 'debug',
                scope: 'forceRefresh',
            },
        );

        return next(context);
    }

    await context.route.refresher.refresh(url.pathname);

    const redirectionUrl = new URL(url);
    redirectionUrl.searchParams.delete('force_refresh');

    return new Response(null, {
        status: http.Status.SeeOther,
        headers: {
            Location: redirectionUrl.href,
        },
    });
}
