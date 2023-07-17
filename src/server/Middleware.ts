export type Next<CONTEXT = unknown> = (
    context: CONTEXT,
) => Promise<Response>;

export type Middleware<CONTEXT = unknown> = (
    context: CONTEXT,
    next: Next<CONTEXT>,
) => Promise<Response> | Response;

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
