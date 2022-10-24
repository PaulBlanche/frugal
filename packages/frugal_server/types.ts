export type Next<CONTEXT = unknown> = (
    context: CONTEXT,
) => Promise<Response>;

export type Middleware<CONTEXT = unknown> = (
    context: CONTEXT,
    next: Next<CONTEXT>,
) => Promise<Response>;
