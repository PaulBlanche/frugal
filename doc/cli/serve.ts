import * as dotenv from '../../dep/std/dotenv.ts';

if (Deno.env.get('CI') === undefined) {
    await dotenv.config({
        safe: true,
        export: true,
        path: new URL('../.env', import.meta.url).pathname,
    });
}

const { serve } = await import('./_server.ts');
await serve()
