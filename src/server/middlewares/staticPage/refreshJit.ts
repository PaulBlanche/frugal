import { StaticRoute } from '../../../page/Router.ts';
import { Next } from '../../types.ts';
import { RouteContext } from '../RouteContext.ts';

export async function refreshJit(
  context: RouteContext<StaticRoute>,
  next: Next<RouteContext<StaticRoute>>,
) {
  const url = new URL(context.request.url);

  context.log(`refresh page`, {
    kind: 'debug',
    scope: 'refreshJit',
  });

  await context.route.refresher.refresh(url.pathname);

  return next(context);
}
