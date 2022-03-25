import { build, page } from '../../packages/core/mod.ts';

import * as myPage from './page.ts';

export const frugal = build({
    // since deno does not have any notion of "root of module", frugal needs to
    // rely on you giving a root directory. Every relative path in the
    // configuration will be resolved relative to this directory.
    self: new URL(import.meta.url),

    // the directory relative to `root` where to output the result of the build
    outputDir: './dist',

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
