import { script } from '$dep/frugal/plugins/script.ts';
import { style } from '$dep/frugal/plugins/style.ts';
import { svg } from '$dep/frugal/plugins/svg.ts';
import { cssModule } from '$dep/frugal/plugins/cssModule.ts';
import { FrugalConfig } from '$dep/frugal/mod.ts';
import { UpstashPersistence } from '$dep/frugal/persistence.ts';

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
    runtimePersistence: Deno.env.get('PERSISTENCE') === 'filesystem'
        ? undefined
        : new UpstashPersistence(
            'https://eu1-intense-kodiak-36255.upstash.io',
            'AY2fACQgMDUyZDkwZjktMWMwZS00NDdiLWFmOTktODIzOTVkZmY3YzQxZDliOTkxNWJjNmFhNDZkZWFiNjEwODc5ZDU3N2MwZDM=',
        ),
} as FrugalConfig;
