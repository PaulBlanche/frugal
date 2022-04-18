import { Middleware } from '../../dep/oak.ts';
import * as log from '../log/mod.ts';

function logger() {
    return log.getLogger('frugal_oak:trailingSlashMiddleware');
}

export function trailingSlashMiddleware(): Middleware {
    return async (context, next) => {
        const url = context.request.url;

        // if path ends with trailing slash, redirect without slash
        if (url.pathname.endsWith('/') && url.pathname !== '/') {
            logger().debug({
                method: context.request.method,
                pathname: url.pathname,
                msg() {
                    return `redirect ${this.method} ${this.pathname} without trailing slash`;
                },
            });
            const redirection = url.pathname.slice(0, -1);
            context.response.status = 307;
            context.response.headers.set('Location', redirection);
            return;
        }

        return await next();
    };
}
