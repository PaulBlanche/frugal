import { FrugalResponse } from '../../../page/FrugalResponse.ts';
import { Route } from '../../../page/Router.ts';

import { Next } from '../../types.ts';
import { RouteContext } from '../RouteContext.ts';

import { SESSION_KEY } from './const.ts';

export async function get<ROUTE extends Route>(
  context: RouteContext<ROUTE>,
  next: Next<RouteContext<ROUTE>>,
) {
  if (
    context.session === undefined ||
    context.session.store('token').has(SESSION_KEY)
  ) {
    context.log('no PRG info in session. Yield to next middleware', {
      kind: 'debug',
      scope: 'prg.get',
    });

    return next(context);
  }

  if (context.request.method !== 'GET') {
    context.log(
      `${context.request.method} is not a GET. Yield to next middleware`,
      {
        kind: 'debug',
        scope: 'prg.get',
      },
    );
    return next(context);
  }

  const persistenceStore = context.session.store('persistence');
  const tokenStore = context.session.store('token');

  const sessionData = await persistenceStore.get(SESSION_KEY);

  if (sessionData === undefined) {
    context.log(
      `no page stored in session. Yield to next middleware`,
      {
        kind: 'debug',
        scope: 'prg.get',
      },
    );

    const response = await next(context);

    tokenStore.unset(SESSION_KEY);

    return response;
  }

  const response = FrugalResponse.deserialize(JSON.parse(sessionData));

  if (!response.headers.has('content-type')) {
    response.headers.set('content-type', 'text/html; charset=utf-8');
  }

  if (!response.headers.has('cache-control')) {
    response.headers.set('cache-control', 'no-store');
  }

  await persistenceStore.delete(SESSION_KEY);
  tokenStore.unset(SESSION_KEY);

  return response.toResponse();
}
