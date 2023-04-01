import { Context } from '../Context.ts';
import { Next } from '../types.ts';
import { composeMiddleware } from '../composeMiddleware.ts';
import { RouteContext } from './RouteContext.ts';
import { staticPage } from './staticPage/mod.ts';
import { dynamicPage } from './dynamicPage/mod.ts';
import { etag } from './etag.ts';
import { csrf } from './csrf/mod.ts';

export function router(context: Context, next: Next<Context>) {
  const url = new URL(context.request.url);
  const route = context.router.getMatchingRoute(url.pathname);

  if (route === undefined) {
    context.log(`no route found for ${url.pathname}. Yield.`, {
      kind: 'debug',
      scope: 'router',
    });

    return next(context);
  }

  // route can't handle the request method, yield
  const method = context.request.method;
  if (!(method in route.page)) {
    context.log(
      `Page ${route.page.pattern} can\'t handle ${method}. Yield.`,
      {
        kind: 'debug',
        scope: 'router',
      },
    );

    return next(context);
  }

  context.session?.shouldAttach();

  return composedMiddleware(
    { ...context, route },
    next,
  );
}

const composedMiddleware = composeMiddleware<RouteContext>(
  csrf,
  etag,
  staticPage,
  dynamicPage,
);
