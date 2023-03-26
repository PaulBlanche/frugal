import { Middleware, Next } from './types.ts';

export function composeMiddleware<CONTEXT>(
    ...middlewares: Middleware<CONTEXT>[]
): Middleware<CONTEXT> {
    return (context, next) => {
        const composedNext = middlewares.reduceRight<Next<CONTEXT>>(
            (composedNext, middleware) => {
                return (context) => {
                    return Promise.resolve(middleware(context, composedNext));
                };
            },
            next,
        );

        return composedNext(context);
    };
}
