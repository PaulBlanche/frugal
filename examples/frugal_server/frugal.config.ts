import { page } from '../../packages/core/mod.ts';
import { Config } from '../../packages/server/mod.ts';

import * as pageISR from './page-isr.ts';
import * as pageSSR from './page-ssr.ts';
import { StyleLoader } from '../../packages/loader_style/mod.ts';

export const config: Config = {
    // since deno does not have any notion of "root of module", frugal needs to
    // rely on you giving a root directory. Every relative path in the
    // configuration will be resolved relative to this directory.
    self: new URL(import.meta.url),

    // the directory relative to `root` where to output the result of the build
    outputDir: './dist',

    // the pages that need to be built
    pages: [
        page(pageISR),
        page(pageSSR),
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
            'frugal_server:generateMiddleware': 'DEBUG',
            'frugal_server:dynamicPageMiddleware': 'DEBUG',
            'frugal_server:postRedirectGet:getMiddleware': 'DEBUG',
            'frugal_server:postRedirectGet:postRedirectMiddleware': 'DEBUG',
            'frugal_server:cacheMiddleware': 'DEBUG',
            'frugal_server:forceRefreshMiddleware': 'DEBUG',
            'frugal_server:refreshJitMiddleware': 'DEBUG',
            'frugal_server:etagMiddleware': 'DEBUG',
            'frugal_server:filesystemMiddleware': 'DEBUG',
            'frugal_server:pageRouterMiddleware': 'DEBUG',
            'frugal_server:FrugalServer': 'DEBUG',
                },
    },

    loaders: [
        new StyleLoader({
            test: (url) => /\.style\.ts$/.test(url.toString()),
        }),
    ],

    listen: {
        port: 8000
    }
};
