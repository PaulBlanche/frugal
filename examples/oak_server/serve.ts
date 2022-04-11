import { Frugal } from '../../packages/core/mod.ts';
import { CONFIG, upstash } from './config.ts';

import {
    DynamicRouter,
    PrgOrchestrator,
    SessionManager,
    StaticRouter,
} from '../../packages/frugal_oak/mod.ts';
import { Application } from '../../dep/oak.ts';

const frugal = await Frugal.load(CONFIG);

const application = new Application();

const prgOrchestrator = new PrgOrchestrator(
    frugal,
    new SessionManager(upstash, frugal),
);

const staticRouter = new StaticRouter(
    frugal,
    prgOrchestrator,
    'refresh_key',
);

const dynamicRouter = new DynamicRouter(frugal, prgOrchestrator);

application.use(
    staticRouter.routes(),
    dynamicRouter.routes(),
    staticRouter.allowedMethods(),
    dynamicRouter.allowedMethods(),
    async (context, next) => {
        try {
            await context.send({
                root: frugal.config.publicDir,
            });
        } catch {
            next();
        }
    },
);

application.addEventListener('listen', ({ hostname, port, secure }) => {
    console.log(
        `Listening on: ${secure ? 'https://' : 'http://'}${
            hostname ?? 'localhost'
        }:${port}`,
    );
});

await application.listen({ port: 8000 });
