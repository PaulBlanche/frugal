import * as dotenv from './dep/std/dotenv.ts';

await dotenv.config({
    safe: true,
    export: true,
    path: '/home/whiteshoulders/Personnel/frugal/docs/.env',
});

if (import.meta.main) {
    const command = Deno.args[0];

    switch (command) {
        case 'build': {
            await import('./build.ts');
            break;
        }
        case 'dev': {
            await import('./dev.ts');
            break;
        }
        case 'serve': {
            await import('./serve.ts');
            break;
        }
    }
}
