import { Router, composeMiddleware, Middleware } from '../../dep/oak.ts';
import { Frugal } from '../core/mod.ts';

export function getGenerateMiddleware(frugal: Frugal): Middleware {
    const router = new Router()

    for (const route of frugal.generateRoutes) {
        router.get(route, async (context) => {
            const url = context.request.url
            const result = await frugal.generate(url.pathname, url.searchParams)
            if (result === undefined) {
                context.response.status = 404
                context.response.body = 'Not found'    
                return
            }

            context.response.status = 200
            context.response.body = result.content
        })
    }

    return composeMiddleware([router.routes(), router.allowedMethods()])
}

