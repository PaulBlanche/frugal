import * as frugal from '../../mod.ts';
import * as plugins from '../../plugins.ts';

(await frugal.dev({
    self: import.meta.url,
    pages: ['./home.ts', './counter.ts'],
    importMap: './import_map.json',
    plugins: [
        plugins.script(),
        plugins.style(),
    ],
})).start();
