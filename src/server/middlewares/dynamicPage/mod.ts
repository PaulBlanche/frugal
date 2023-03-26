import { Next } from '../../types.ts';
import * as prg from '../prg/mod.ts';
import { composeMiddleware } from '../../composeMiddleware.ts';
import { generate } from './generate.ts';
import { RouteContext } from '../RouteContext.ts';

export function dynamicPage(context: RouteContext, next: Next<RouteContext>) {
    if (
        context.request.method === 'GET' &&
        context.route.type === 'static' &&
        !context.config.isDevMode
    ) {
        context.log(
            'can\'t dynamically handle static route in non-watch mode. Yield',
            { scope: 'dynamicPage', kind: 'debug' },
        );

        return next(context);
    }

    return composedMiddleware(context, next);
}

const composedMiddleware = composeMiddleware<RouteContext>(
    prg.get,
    prg.postRedirect,
    generate,
);
