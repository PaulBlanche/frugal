import * as _type from "./_type/Middleware.js";
export * from "./_type/Middleware.js";

/**
 * @template CONTEXT
 * @param {_type.Middleware<CONTEXT>[]} middlewares
 * @returns {_type.Middleware<CONTEXT>}
 */
export function composeMiddleware(...middlewares) {
    return (context, next) => {
        const composedNext = middlewares.reduceRight(
            (/** @type {_type.Next<CONTEXT>} */ composedNext, middleware) => {
                return (context) => {
                    return Promise.resolve(middleware(context, composedNext));
                };
            },
            next,
        );

        return composedNext(context);
    };
}
