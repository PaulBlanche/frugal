import { composeMiddleware, Middleware } from '../../dep/oak.ts';
import { Frugal } from '../core/mod.ts';

type Config = {
    frugal: Frugal;
};

export function staticFileMiddleware({ frugal }: Config): Middleware {
    return (context, next) => {
        console.log('static file', context.request.url.pathname);
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
            return await context.send({
                root: frugal.config.publicDir,
                index: 'index.html',
            });
        } catch {
            return await next();
        }
    };
}

function _autoIndexMiddleware(frugal: Frugal): Middleware {
    return async (context, next) => {
        const url = context.request.url;

        // try to serve the file `[pathname]/index.html`
        try {
            console.log('static file try', `${url.pathname}/index.html`);
            return await context.send({
                root: frugal.config.publicDir,
                path: `${url.pathname}/index.html`,
            });
        } catch {
            return await next();
        }
    };
}
