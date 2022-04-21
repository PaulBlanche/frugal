import { SessionManager } from './SessionManager.ts';
import { Frugal, NotFound } from '../core/mod.ts';
import { Context } from 'oak';
import { FrugalContext } from './FrugalContext.ts';
import { assert } from '../../dep/std/asserts.ts';
import * as log from '../log/mod.ts';

function logger(middleware?: string) {
    if (middleware === undefined) {
        return log.getLogger('frugal_oak:PrgOrchestrator');
    }
    return log.getLogger(`frugal_oak:PrgOrchestrator:${middleware}`);
}

export class PrgOrchestrator {
    sessionManager: SessionManager;
    frugal: Frugal;

    constructor(frugal: Frugal, sessionManager: SessionManager) {
        this.sessionManager = sessionManager;
        this.frugal = frugal;
    }

    post() {
        return async (context: Context, _next: () => Promise<unknown>) => {
            const ctx = context as FrugalContext;
            assert(ctx.generator);

            const url = context.request.url;

            logger('postMiddleware').debug({
                method: context.request.method,
                pathname: url.pathname,
                msg() {
                    return `handle ${this.method} ${this.pathname}`;
                },
            });

            const result = await ctx.generator.generate(url.pathname, {
                method: 'POST',
                searchParams: url.searchParams,
                body: context.request.body(),
            });

            const sessionId = await this.sessionManager.set(result.content);

            logger('postMiddleware').debug({
                method: context.request.method,
                pathname: url.pathname,
                session: sessionId,
                msg() {
                    return `serve ${this.method} ${this.pathname} with a PRG redirection with session ${this.session}`;
                },
            });

            await context.cookies.set('prg_session', sessionId);
            context.response.status = 303;
            context.response.headers.set('Location', url.pathname);
        };
    }

    getRedirection() {
        return async (
            context: Context,
            next: () => Promise<unknown>,
        ): Promise<unknown> => {
            const sessionId = await context.cookies.get('prg_session');
            if (sessionId === undefined) {
                logger('getRedirectionMiddleware').debug({
                    msg() {
                        return `no session cookie, skip middleware`;
                    },
                });

                return await next();
            }

            await context.cookies.delete('prg_session');

            try {
                logger('getRedirectionMiddleware').debug({
                    method: context.request.method,
                    pathname: context.request.url.pathname,
                    session: sessionId,
                    msg() {
                        return `try to save ${this.method} ${this.pathname} with page saved in session ${this.session}`;
                    },
                });

                const content = await this.sessionManager.get(sessionId);

                context.response.status = 200;
                context.response.body = content;

                await this.sessionManager.delete(sessionId);
            } catch (error: unknown) {
                if (error instanceof NotFound) {
                    logger('getRedirectionMiddleware').debug({
                        method: context.request.method,
                        pathname: context.request.url.pathname,
                        session: sessionId,
                        msg() {
                            return `No page saved in session ${this.session} for ${this.method} ${this.pathname}, delegate to next middleware`;
                        },
                    });
                    return await next();
                }
                throw error;
            }
        };
    }
}
