import { etag, Middleware } from 'oak';
import * as log from '../log/mod.ts';

function logger() {
    return log.getLogger(`frugal_oak:etagMiddleware`);
}

export function etagMiddleware(): Middleware {
    const baseEtagMiddleware = etag.factory();
    return async (context, next) => {
        await baseEtagMiddleware(context, next);

        const ifNoneMatch = context.request.headers.get('If-None-Match');
        if (ifNoneMatch) {
            const entity = await etag.getEntity(context);
            if (entity) {
                const sameEntity = await etag.ifNoneMatch(ifNoneMatch, entity);
                if (sameEntity) {
                    logger().debug({
                        pathname: context.request.url.pathname,
                        msg() {
                            return `No Etag change for ${this.pathname}, send empty 304`;
                        },
                    });

                    context.response.body = null;
                    context.response.status = 304;
                }
            }
        }
    };
}
