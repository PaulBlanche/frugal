import { SessionManager } from './SessionManager.ts';
import { FrugalInstance, NotFound } from '../core/mod.ts';
import { Context } from 'oak';
import { FrugalContext } from './FrugalContext.ts';
import { assert } from '../../dep/std/asserts.ts';
import * as log from '../log/mod.ts';

const SESSION_COOKIE_NAME = 'frugal_prg_session';

function logger(middleware?: string) {
    if (middleware === undefined) {
        return log.getLogger('frugal_oak:PrgOrchestrator');
    }
    return log.getLogger(`frugal_oak:PrgOrchestrator:${middleware}`);
}

/**
 * Class exposing middlewares handling Post-Redirect-Get pattern.
 */
export class PrgOrchestrator {
    #sessionManager: SessionManager;
    #frugal: FrugalInstance;

    constructor(frugal: FrugalInstance, sessionManager: SessionManager) {
        this.#sessionManager = sessionManager;
        this.#frugal = frugal;
    }

    /**
     * Return a oak middleware able to handle the Post and Redirect part of the
     * Post-Redirect-Get pattern.
     *
     * The page resulting of the Post request is generated and persisted in a
     * session. The middleware answers with a Redirection and a session cookie.
     */
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

            const result = await ctx.generator.generate({
                url: context.request.url,
                headers: context.request.headers,
                method: 'POST',
                body: context.request.body(),
            });

            const sessionId = await this.#sessionManager.set(result.content);

            logger('postMiddleware').debug({
                method: context.request.method,
                pathname: url.pathname,
                session: sessionId,
                msg() {
                    return `serve ${this.method} ${this.pathname} with a PRG redirection with session ${this.session}`;
                },
            });

            await context.cookies.set(SESSION_COOKIE_NAME, sessionId);
            context.response.status = 303;
            context.response.headers.set('Location', url.pathname);
        };
    }

    /**
     * Return a oak middleware able to handle the Get part of the
     * Post-Redirect-Get pattern.
     *
     * If a session cookie is present on the request, the middleware answers
     * with the page persisted in the session and deletes the session.
     */
    getRedirection() {
        return async (
            context: Context,
            next: () => Promise<unknown>,
        ): Promise<unknown> => {
            const sessionId = await context.cookies.get(SESSION_COOKIE_NAME);
            if (sessionId === undefined) {
                logger('getRedirectionMiddleware').debug({
                    msg() {
                        return `no session cookie, skip middleware`;
                    },
                });

                return await next();
            }

            await context.cookies.delete(SESSION_COOKIE_NAME);

            try {
                logger('getRedirectionMiddleware').debug({
                    method: context.request.method,
                    pathname: context.request.url.pathname,
                    session: sessionId,
                    msg() {
                        return `try to save ${this.method} ${this.pathname} with page saved in session ${this.session}`;
                    },
                });

                const content = await this.#sessionManager.get(sessionId);

                context.response.status = 200;
                context.response.body = content;
                context.response.headers.set(
                    'Cache-Control',
                    'no-store',
                );

                await this.#sessionManager.delete(sessionId);
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
