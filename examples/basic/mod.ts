import { build } from '../../packages/core/mod.ts';

const ROOT = new URL(import.meta.url).pathname;

build({
    root: ROOT,
    outputDir: './dist',
    pages: [
        './page.ts',
    ],
    logging: {
        type: 'human',
        loggers: {
            'frugal:asset': 'DEBUG',
            'frugal:Builder': 'DEBUG',
            'frugal:FrugalContext': 'DEBUG',
            'frugal:PageRefresher': 'DEBUG',
            'frugal:PageBuilder': 'DEBUG',
            'frugal:Refresher': 'DEBUG',
            'frugal:Cache': 'DEBUG',
            'frugal:dependency_graph': 'DEBUG',
            'frugal:loader:jsx_svg': 'DEBUG',
            'frugal:loader:script': 'DEBUG',
            'frugal:loader:style': 'DEBUG',    
        },
    },
});
