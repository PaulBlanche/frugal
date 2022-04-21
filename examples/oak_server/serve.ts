import { Frugal } from '../../packages/core/mod.ts';
import { CONFIG } from './config.ts';

import { frugalMiddleware } from '../../packages/frugal_oak/mod.ts';
import { Application } from 'oak';

const frugal = await Frugal.load(CONFIG);

const application = new Application();

application.use(
    await frugalMiddleware(frugal, {
        // Logging configuration. In the context of this exemple, all loggers are
        // set to DEBUG, but by default everything is set to `INFO`.
        loggers: {
            'frugal_oak:DynamicRouter': 'DEBUG',
            'frugal_oak:DynamicRouter:generateMiddleware': 'DEBUG',
            'frugal_oak:PrgOrchestrator': 'DEBUG',
            'frugal_oak:PrgOrchestrator:postMiddleware': 'DEBUG',
            'frugal_oak:PrgOrchestrator:getRedirectionMiddleware': 'DEBUG',
            'frugal_oak:staticFileMiddleware': 'DEBUG',
            'frugal_oak:staticFileMiddleware:filesystemMiddleware': 'DEBUG',
            'frugal_oak:staticFileMiddleware:autoIndexMiddleware': 'DEBUG',
            'frugal_oak:StaticRouter': 'DEBUG',
            'frugal_oak:StaticRouter:forceRefreshMiddleware': 'DEBUG',
            'frugal_oak:StaticRouter:cachedMiddleware': 'DEBUG',
            'frugal_oak:StaticRouter:refreshJitMiddleware': 'DEBUG',
        },
    }),
);

application.addEventListener('listen', ({ hostname, port, secure }) => {
    console.log(
        `Listening on: ${secure ? 'https://' : 'http://'}${
            hostname ?? 'localhost'
        }:${port}`,
    );
});

await application.listen({ port: 8000 });
