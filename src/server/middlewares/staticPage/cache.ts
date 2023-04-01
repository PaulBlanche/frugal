import { StaticRoute } from '../../../page/Router.ts';

import * as etag from '../../etag.ts';
import { Next } from '../../types.ts';

import { RouteContext } from '../RouteContext.ts';

export async function cache(
  context: RouteContext<StaticRoute>,
  next: Next<RouteContext<StaticRoute>>,
) {
  const url = new URL(context.request.url);

  context.log(`try to respond from cache`, {
    kind: 'debug',
    scope: 'cache',
  });

  const response = await fromCache(context, url.pathname);

  if (response !== undefined) {
    return response;
  }

  context.log(
    `no response found in cache. Yield to next middleware`,
    {
      kind: 'debug',
      scope: 'cache',
    },
  );
  return await next(context);
}

export async function fromCache(
  context: RouteContext<StaticRoute>,
  pathname: string,
): Promise<Response | undefined> {
  const response = await context.router.responseCache.get(pathname);

  if (response === undefined) {
    return;
  }

  if (response.body === undefined) {
    return response.toResponse();
  }

  if (!response.headers.has('etag')) {
    response.headers.set('Etag', await etag.compute(response.body));
  }

  if (!response.headers.has('content-type')) {
    response.headers.set('content-type', 'text/html; charset=utf-8');
  }

  return response.toResponse();
}
