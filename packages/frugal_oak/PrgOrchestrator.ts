import { SessionManager } from './SessionManager.ts';
import { Frugal, NotFound } from '../core/mod.ts';
import { Context } from '../../dep/oak.ts';
import { FrugalContext } from './FrugalContext.ts';
import { assert } from '../../dep/std/asserts.ts';

export class PrgOrchestrator {
    sessionManager: SessionManager;
    frugal: Frugal;

    constructor(frugal: Frugal, sessionManager: SessionManager) {
        this.sessionManager = sessionManager;
        this.frugal = frugal;
    }

    post() {
        return async (context: Context, next: () => Promise<unknown>) => {
            const ctx = context as FrugalContext;
            assert(ctx.generator);

            const url = context.request.url;
            const result = await ctx.generator.generate(url.pathname, {
                method: 'POST',
                searchParams: url.searchParams,
                body: context.request.body(),
            });

            const sessionId = await this.sessionManager.set(result.content);

            console.log('prg post generate', url.pathname);

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
                return await next();
            }

            console.log('prg get redirect', context.request.url.pathname);

            await context.cookies.delete('prg_session');

            try {
                const content = await this.sessionManager.get(sessionId);

                context.response.status = 200;
                context.response.body = content;

                await this.sessionManager.delete(sessionId);
            } catch (error: unknown) {
                if (error instanceof NotFound) {
                    return await next();
                }
                throw error;
            }
        };
    }
}
