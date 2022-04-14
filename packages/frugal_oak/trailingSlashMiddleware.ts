import { Middleware } from '../../dep/oak.ts';

export function trailingSlashMiddleware(): Middleware {
    return async (context, next) => {
        const url = context.request.url;
        console.log('_trailingSlashMiddleware', url.pathname);

        // if path ends with trailing slash, redirect without slash
        if (url.pathname.endsWith('/') && url.pathname !== '/') {
            const redirection = url.pathname.slice(0, -1);
            context.response.status = 307;
            context.response.headers.set('Location', redirection);
            return;
        }

        return await next();
    };
}
