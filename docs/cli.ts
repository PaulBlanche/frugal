import * as dotenv from './dep/std/dotenv.ts';
import { build } from './dep/frugal/core.ts';
import { serve, watch } from './dep/frugal/frugal_server.ts';
import * as path from './dep/std/path.ts';

import { config } from './frugal.config.ts';

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
            await build(config);
            break;
        }
        case 'dev': {
            await watch(config, [path.resolve(Deno.cwd(), 'docs/data')]);
            break;
        }
        default:
        case 'serve': {
            await serve(config);
            break;
        }
    }
}
