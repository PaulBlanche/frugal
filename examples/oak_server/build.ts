import { build, page } from '../../packages/core/mod.ts';
import {
    getDynamicRouter,
    getRefreshRouter,
    getStaticRouter,
} from '../../packages/frugal_oak/mod.ts';
import { Application } from '../../dep/oak.ts';

import * as pageISR from './page-isr.ts';
import * as pageSSR from './page-ssr.ts';

// the `build` function returns a `Frugal` object, thant can be used later on the server.
// If you want to run the build in a separate process as the server, you can use
// `Frugal.load()` with the same config object, to get the same `Frugal` object
// you would get after a `build`.
const frugal = await build({
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
        },
    },
});

const application = new Application();

// this router will handle static pages. Thr build step will populate the cache
// of static files. But you can have pages that you decided not to generate during
// the build (not generating less frequently visited pages, to have a quick build).
// This router will try to return the html page from the cache. If it fails, it
// will build and return the requested page, adding it to the cache for
// future requests.
const staticRouter = getStaticRouter(frugal);

// static pages are generated once, either during the build, or the first request
// (with the `staticRouter`). If want to refresh the page, this router exposes an
// endpoint that will trigger a build job for a given page. This endpoint act
// as a webhook to call when data for some pages change.
const refreshRouter = getRefreshRouter(frugal);

// this router handles dynamic pages. Nothing is cached, on each request, the data
// is fetched and the html generated.
const dynamicRouter = getDynamicRouter(frugal);

application.use(
    staticRouter.routes(),
    refreshRouter.routes(),
    dynamicRouter.routes(),
    staticRouter.allowedMethods(),
    refreshRouter.allowedMethods(),
    dynamicRouter.allowedMethods(),
);

application.addEventListener('listen', ({ hostname, port, secure }) => {
    console.log(
        `Listening on: ${secure ? 'https://' : 'http://'}${
            hostname ?? 'localhost'
        }:${port}`,
    );
});

await application.listen({ port: 8000 });
