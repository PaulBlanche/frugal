import { build } from '../../packages/core/mod.ts';
import { getStaticRouter, getRefreshRouter, getDynamicRouter } from '../../packages/frugal_oak/mod.ts';
import { Application } from '../../dep/oak.ts';

const ROOT = new URL(import.meta.url).pathname;

const frugal = await build({
    root: ROOT,
    outputDir: './dist',
    pages: [
        './page-isr.ts',
        './page-ssr.ts',
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

const application = new Application()
const staticRouter = getStaticRouter(frugal)
const refreshRouter = getRefreshRouter(frugal)
const dynamicRouter = getDynamicRouter(frugal)

application.use(
    staticRouter.routes(), 
    refreshRouter.routes(), 
    dynamicRouter.routes(), 
    staticRouter.allowedMethods(), 
    refreshRouter.allowedMethods(), 
    dynamicRouter.allowedMethods()
)

await application.listen({ port: 8000 });