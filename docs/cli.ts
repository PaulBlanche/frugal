import * as dotenv from './dep/std/dotenv.ts';

if (Deno.env.get('CI') === undefined) {
    await dotenv.config({
        safe: true,
        export: true,
        path: new URL('.env', import.meta.url).pathname,
    });
}

if (import.meta.main) {
    const command = Deno.args[0];

    switch (command) {
        case 'build': {
            await import('./cli/build.ts');
            break;
        }
        case 'dev': {
            await import('./cli/watch.ts');
            break;
        }
        case 'serve': {
            await import('./cli/serve.ts');
            break;
        }
    }
}
