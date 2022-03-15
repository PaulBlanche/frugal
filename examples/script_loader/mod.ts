import { build } from '../../packages/core/mod.ts';
import { script } from '../../packages/loader_script/mod.ts';

const ROOT = new URL(import.meta.url).pathname;

build({
    root: ROOT,
    outputDir: './dist',
    loaders: [
        script({
            name: 'body',
            test: (url) => /\.script\.ts$/.test(url.toString()),
            outputs: [{
                format: 'esm'
            }],
        }),
    ],
    pages: [
        './page1.ts',
        './page2.ts',
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
