import { build } from '../../packages/core/mod.ts';
import * as path from '../../dep/std/path.ts';
import { script } from '../../packages/loader_script/mod.ts';
import { rollupImportMapPlugin } from '../../dep/rollup-plugin-import-map.ts';

const ROOT = new URL(import.meta.url).pathname;

const IMPORT_MAP = path.resolve(path.dirname(ROOT), '../../import_map.json')

build({
    root: ROOT,
    outputDir: './dist',
    importMap: IMPORT_MAP,
    loaders: [script({
        name: 'body',
        test: (url) => /\.script\.ts$/.test(url.toString()),
        input: {
            plugins: [
                rollupImportMapPlugin({
                    maps: IMPORT_MAP
                }) as any
            ]
        },
        outputs: [{
            format: 'esm'
        }],
    })],
    pages: [
        './page.tsx',
    ],
    logging: {
        type: 'human',
        loggers: {
            'frugal:asset': 'DEBUG',
            'frugal:Builder': 'DEBUG',
            'frugal:FrugalContext': 'DEBUG',
            'frugal:PageRegenerator': 'DEBUG',
            'frugal:PageBuilder': 'DEBUG',
            'frugal:Regenerator': 'DEBUG',
            'frugal:Cache': 'DEBUG',
            'frugal:dependency_graph': 'DEBUG',
            'frugal:RegeneratorWorker': 'DEBUG',
            'frugal:loader:jsx_svg': 'DEBUG',
            'frugal:loader:script': 'DEBUG',
            'frugal:loader:style': 'DEBUG',    
        },
    },
});

declare global {
    interface Crypto {
        randomUUID: () => string;
    }
}
