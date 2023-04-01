import * as frugal from 'frugal/mod.ts';
import * as dotenv from '../../dep/std/dotenv.ts';

if (Deno.env.get('CI') === undefined) {
    await dotenv.config({
        safe: true,
        export: true,
        path: new URL('../.env', import.meta.url).pathname,
    });
}

const { default: config } = await import('../frugal.config.ts');

await frugal.build(config);
