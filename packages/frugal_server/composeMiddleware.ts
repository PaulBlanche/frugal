import { Context, Middleware, Next } from './types.ts';

export function composeMiddleware<CONTEXT extends Context = Context>(
    ...middlewares: Middleware<CONTEXT>[]
): Middleware<CONTEXT> {
    return (context: CONTEXT, next: Next<CONTEXT>) => {
        const composed = middlewares.reduceRight<Next<CONTEXT>>(
            (composed, middleware) => {
                return (context: CONTEXT) => {
                    return middleware(context, composed);
                };
            },
            next,
        );

        return composed(context);
    };
}
