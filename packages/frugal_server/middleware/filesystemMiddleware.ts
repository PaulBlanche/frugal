import * as path from '../../../dep/std/path.ts';
import * as http from '../../../dep/std/http.ts';

import * as log from '../../log/mod.ts';

import { Next } from '../types.ts';
import { FrugalContext } from './types.ts';

const ONE_YEAR_IN_SECONDS = 31536000;

function logger() {
    return log.getLogger(`frugal_server:filesystemMiddleware`);
}

export async function filesystemMiddleware(
    context: FrugalContext,
    next: Next<FrugalContext>,
): Promise<Response> {
    const url = new URL(context.request.url);

    // try to serve the file as is from the filesystem
    try {
        logger().debug({
            method: context.request.method,
            pathname: url.pathname,
            msg() {
                return `try to respond to ${this.method} ${this.pathname} with static file`;
            },
        });

        const response = await http.serveFile(
            context.request,
            path.join(context.frugal.config.publicDir, url.pathname),
        );

        response.headers.set(
            'Cache-Control',
            `max-age=${ONE_YEAR_IN_SECONDS} immutable`,
        );

        return response;
    } catch {
        logger().debug({
            method: context.request.method,
            pathname: url.pathname,
            msg() {
                return `No static file found for ${this.method} ${this.pathname}. Yield to next middleware`;
            },
        });

        return next(context);
    }
}
