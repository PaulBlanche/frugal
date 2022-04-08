import { Frugal } from '../../packages/core/mod.ts';
import { CONFIG } from './config.ts';

import {
    getDynamicRouter,
    getRefreshRouter,
    getStaticRouter,
} from '../../packages/frugal_oak/mod.ts';
import { Application } from '../../dep/oak.ts';

const frugal = await Frugal.load(CONFIG);

const application = new Application();

const staticRouter = getStaticRouter(frugal);

const refreshRouter = getRefreshRouter(frugal);

const dynamicRouter = getDynamicRouter(frugal);

application.use(
    staticRouter.routes(),
    refreshRouter.routes(),
    dynamicRouter.routes(),
    staticRouter.allowedMethods(),
    refreshRouter.allowedMethods(),
    dynamicRouter.allowedMethods(),
);

application.addEventListener('listen', ({ hostname, port, secure }) => {
    console.log(
        `Listening on: ${secure ? 'https://' : 'http://'}${
            hostname ?? 'localhost'
        }:${port}`,
    );
});

await application.listen({ port: 8000 });
