import { config } from './frugal.config.ts';
import { Frugal, UpstashPersistance } from './dep/frugal/core.ts';
import { Application } from './dep/oak.ts';
import { frugalMiddleware } from './dep/frugal/frugal_oak.ts';

const devMode = Deno.env.get('FRUGAL_DEV') !== undefined;

const frugal = await getFrugalInstance(devMode);

const application = new Application();

application.use(
    await frugalMiddleware(frugal, {
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
        sessionPersistance: new UpstashPersistance(
            'https://eu1-intense-kodiak-36255.upstash.io',
            'AY2fACQgMDUyZDkwZjktMWMwZS00NDdiLWFmOTktODIzOTVkZmY3YzQxZDliOTkxNWJjNmFhNDZkZWFiNjEwODc5ZDU3N2MwZDM=',
        ),
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

async function getFrugalInstance(devMode: boolean) {
    if (devMode) {
        return await Frugal.build({
            devMode,
            ...config,
        });
    }
    return await Frugal.load(config);
}
