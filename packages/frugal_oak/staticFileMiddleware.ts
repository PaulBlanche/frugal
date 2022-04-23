import { composeMiddleware, Middleware } from 'oak';
import { Frugal } from '../core/mod.ts';
import * as log from '../log/mod.ts';

function logger(middleware?: string) {
    if (middleware === undefined) {
        return log.getLogger('frugal_oak:staticFileMiddleware');
    }
    return log.getLogger(`frugal_oak:staticFileMiddleware:${middleware}`);
}

type Config = {
    frugal: Frugal;
};

export function staticFileMiddleware({ frugal }: Config): Middleware {
    return (context, next) => {
        logger().debug({
            method: context.request.method,
            pathname: context.request.url.pathname,
            msg() {
                return `handle ${this.method} ${this.pathname}`;
            },
        });
        return composeMiddleware([
            _filesystemMiddleware(frugal),
            _autoIndexMiddleware(frugal),
        ])(context, next);
    };
}

function _filesystemMiddleware(frugal: Frugal): Middleware {
    return async (context, next) => {
        // try to serve the file as is from the filesystem
        try {
            logger('filesystemMiddleware').debug({
                method: context.request.method,
                pathname: context.request.url.pathname,
                msg() {
                    return `try to respond to ${this.method} ${this.pathname} with static file`;
                },
            });

            await context.send({
                root: frugal.config.publicDir,
            });

            context.response.headers.set(
                'Cache-Control',
                'max-age=31536000, immutable',
            );
        } catch {
            logger('filesystemMiddleware').debug({
                method: context.request.method,
                pathname: context.request.url.pathname,
                msg() {
                    return `No static file found for ${this.method} ${this.pathname}, delegate to next middleware`;
                },
            });

            await next();
        }
    };
}

function _autoIndexMiddleware(frugal: Frugal): Middleware {
    return async (context, next) => {
        const url = context.request.url;

        const filename = `${url.pathname}/index.html`;
        // try to serve the file `[pathname]/index.html`
        try {
            logger('autoIndexMiddleware').debug({
                method: context.request.method,
                pathname: context.request.url.pathname,
                filename,
                msg() {
                    return `try to respond to ${this.method} ${this.pathname} with ${this.filename}`;
                },
            });

            await context.send({
                root: frugal.config.publicDir,
                path: filename,
            });

            context.response.headers.set(
                'Cache-Control',
                'max-age=31536000, immutable',
            );
        } catch {
            logger('autoIndexMiddleware').debug({
                method: context.request.method,
                pathname: context.request.url.pathname,
                filename,
                msg() {
                    return `file ${this.filename} not found for ${this.method} ${this.pathname}, delegate to next middleware`;
                },
            });

            return await next();
        }
    };
}
