import { config } from './frugal.config.ts';
import { Frugal } from './dep/frugal/core.ts';
import { Application } from './dep/oak.ts';
import { frugalMiddleware } from './dep/frugal/frugal_oak.ts';

const devMode = Deno.env.get('FRUGAL_DEV') !== undefined;

const frugal = await getFrugalInstance(devMode);

const application = new Application();

application.use(frugalMiddleware(frugal));

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
