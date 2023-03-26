import * as etag from '../../etag.ts';
import { RouteContext } from '../RouteContext.ts';

export async function generate(context: RouteContext): Promise<Response> {
    context.log(`generating page`, { kind: 'debug', scope: 'generate' });

    const response = await context.route.generator.generate(
        context.request,
        context.state,
    );

    if (response.body === undefined) {
        return response.toResponse();
    }

    if (!response.headers.has('content-type')) {
        response.headers.set('content-type', 'text/html; charset=utf-8');
    }

    if (!response.headers.has('etag')) {
        response.headers.set('Etag', await etag.compute(response.body));
    }

    return response.toResponse();
}
