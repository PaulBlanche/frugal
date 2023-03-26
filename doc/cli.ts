import * as frugal from '$dep/frugal/mod.ts';
import * as dotenv from '$dep/std/dotenv.ts';

if (Deno.env.get('CI') === undefined) {
    await dotenv.config({
        safe: true,
        export: true,
        path: new URL('.env', import.meta.url).pathname,
    });
}

const { default: config } = await import('./src/frugal.config.ts');

const [mode] = Deno.args;

switch (mode) {
    case 'dev': {
        (await frugal.dev(config)).start();
        break;
    }
    case 'build': {
        await frugal.build(config);
        break;
    }
    case 'create_key': {
        console.log(await frugal.exportKey());
        break;
    }
    default:
    case 'serve': {
        await frugal.serve(config);
        break;
    }
}
