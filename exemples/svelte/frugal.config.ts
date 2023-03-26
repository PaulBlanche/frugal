import * as frugal from '../../mod.ts';
import * as plugins from '../../plugins.ts';

const config: frugal.FrugalConfig = {
    self: import.meta.url,
    pages: ['./src/home.ts', './src/counter.ts'],
    importMap: './import_map.json',
    plugins: [
        plugins.svelte(),
        plugins.script(),
        plugins.style(),
    ],
};

(await frugal.dev(config)).start();
