import { Router, composeMiddleware, Middleware } from '../../dep/oak.ts';
import { Frugal } from '../core/mod.ts';

export function getRefreshMiddleware(frugal: Frugal): Middleware {
    const router = new Router()

    router.post('/regenerate', async (context) => {
        const pathname = context.request.url.searchParams.get('pathname')
        
        if (pathname === null) {
            context.response.status = 400
            context.response.body = 'No pathname'
            return
        }

        const success = await frugal.refresh(pathname)
    
        if (!success) {
            context.response.status = 422
            context.response.body = 'No page matching pathname found'
            return
        }

        context.response.status = 201
        context.response.body = 'Page regenerated'
    })

    return composeMiddleware([router.routes(), router.allowedMethods()])
}

