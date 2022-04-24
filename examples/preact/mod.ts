import { build, page } from '../../packages/core/mod.ts';
import { script } from '../../packages/loader_script/mod.ts';

import * as myPage from './page.ts';

const IMPORT_MAP = new URL('../../import_map.json', import.meta.url).pathname;

build({
    // since deno does not have any notion of "root of module", frugal needs to
    // rely on you giving a root directory. Every relative path in the
    // configuration will be resolved relative to this directory.
    self: new URL(import.meta.url),

    // the directory relative to `root` where to output the result of the build
    outputDir: './dist',

    // an import map file, relative to `root`. This is needed for preact integration
    // to let you define the version of preact you wish to use. The `frugal_preact`
    // module use bare imports `preact`, `preact/hooks` and `preact-render-to-string`.
    importMap: IMPORT_MAP,

    // registered loaders. We register the script loader with the name "body",
    // and configured to catch all import ending in `.script.ts`. The bundles
    // will be outputed in `esm` format and with code splitting.
    // see the `script_loader` example for more info.
    loaders: [script({
        bundles: [{
            name: 'body',
            test: (url) => /\.script\.ts$/.test(url.toString()),
        }],
        format: 'esm',
        splitting: true,
        importMapFile: IMPORT_MAP,
    })],

    // the pages that need to be built
    pages: [
        page(myPage),
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
