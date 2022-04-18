import { build, page } from '../../packages/core/mod.ts';
import { script } from '../../packages/loader_script/mod.ts';

import * as page1 from './page1.ts';
import * as page2 from './page2.ts';

build({
    // since deno does not have any notion of "root of module", frugal needs to
    // rely on you giving a root directory. Every relative path in the
    // configuration will be resolved relative to this directory.
    self: new URL(import.meta.url),

    // the directory relative to `root` where to output the result of the build
    outputDir: './dist',

    // registered loaders. We register the script loader withe the name "body",
    // and configured to catch all import ending in `.script.ts`. The bundles
    // will be outputed in `esm` format and with code splitting.
    // You will get a different bundle for each entrypoint, but the code splitting
    // will be done amongst all entrypoint.
    // In our case scripts used in both `page1.ts` and `page2.ts` share some code
    // so this code will be put in a shared chunk
    loaders: [
        script({
            name: 'body',
            test: (url) => /\.script\.ts$/.test(url.toString()),
            formats: ['esm'],
            bundle: true,
            splitting: true,
        }),
    ],

    // the pages that need to be built
    pages: [
        page(page1),
        page(page2),
    ],

    // Logging configuration. In the context of this exemple, all loggers are
    // set to DEBUG, but by default everything is set to `INFO`.
    logging: {
        type: 'human',
        loggers: {
            'frugal:asset': 'DEBUG',
            'frugal:Builder': 'DEBUG',
            'frugal:Cache': 'DEBUG',
            'frugal:Frugal': 'DEBUG',
            'frugal:FrugalContext': 'DEBUG',
            'frugal:Generator': 'DEBUG',
            'frugal:LoaderContext': 'DEBUG',
            'frugal:PageBuilder': 'DEBUG',
            'frugal:PageGenerator': 'DEBUG',
            'frugal:PageRefresher': 'DEBUG',
            'frugal:Refresher': 'DEBUG',
            'frugal:dependency_graph': 'DEBUG',
            'frugal:loader:jsx_svg': 'DEBUG',
            'frugal:loader:script': 'DEBUG',
            'frugal:loader:style': 'DEBUG',
        },
    },
});
