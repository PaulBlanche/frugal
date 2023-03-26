import { script } from '$dep/frugal/plugins/script.ts';
import { style } from '$dep/frugal/plugins/style.ts';
import { svg } from '$dep/frugal/plugins/svg.ts';
import { cssModule } from '$dep/frugal/plugins/cssModule.ts';
import { FrugalConfig, importKey } from '$dep/frugal/mod.ts';
import { UpstashPersistence } from '$dep/frugal/persistence.ts';

const CRYPTO_KEY = Deno.env.get('CRYPTO_KEY');
const PERSISTENCE = Deno.env.get('PERSISTENCE');

export default {
    self: import.meta.url,
    outdir: '../dist/',
    pages: ['./pages/home/mod.ts'],
    importMap: '../import_map.json',
    log: {
        level: 'verbose',
    },
    nodeModuleDir: '../node_modules/',
    plugins: [
        cssModule({}),
        svg({}),
        script({}),
        style({}),
    ],
    esbuild: {
        minify: true,
    },
    budget: {
        speed: 6 * 1000 * 1000,
        delay: 1,
    },
    runtimePersistence: PERSISTENCE === 'filesystem' ? undefined : new UpstashPersistence(
        Deno.env.get('UPSTASH_URL') ?? '',
        Deno.env.get('UPSTASH_TOKEN') ?? '',
    ),
    server: {
        port: 8000,
        session: {
            key: CRYPTO_KEY ? await importKey(CRYPTO_KEY) : undefined,
        },
    },
} as FrugalConfig;
