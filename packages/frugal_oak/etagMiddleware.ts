import { etag, Middleware } from 'oak';

export function etagMiddleware(): Middleware {
    const baseEtagMiddleware = etag.factory();
    return async (context, next) => {
        console.log('before etag', context.request.url.href);
        await baseEtagMiddleware(context, next);

        console.log(
            'after etag',
            context.request.url.href,
            context.response.headers.get('Etag'),
        );

        const ifNoneMatch = context.request.headers.get('If-None-Match');
        console.log('ifNoneMatch', context.request.url.href, ifNoneMatch);
        if (ifNoneMatch) {
            const entity = await etag.getEntity(context);
            if (entity && !etag.ifNoneMatch(ifNoneMatch, entity)) {
                console.log('304 for', context.request.url.href);
                context.response.status = 304;
                context.response.body = '';
            }
        }
    };
}
