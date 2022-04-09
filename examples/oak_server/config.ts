import { Config, page, UpstashPersistance } from '../../packages/core/mod.ts';

import * as pageISR from './page-isr.ts';
import * as pageSSR from './page-ssr.ts';
import * as pageForm from './form.ts';
import { style } from '../../packages/loader_style/mod.ts';

const upstash = new UpstashPersistance(
    'https://eu1-intense-kodiak-36255.upstash.io',
    'AY2fACQgMDUyZDkwZjktMWMwZS00NDdiLWFmOTktODIzOTVkZmY3YzQxZDliOTkxNWJjNmFhNDZkZWFiNjEwODc5ZDU3N2MwZDM=',
);

export const CONFIG: Config = {
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
        page(pageForm),
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

    cachePersistance: upstash,
    pagePersistance: upstash,

    loaders: [
        style({
            test: (url) => /\.style\.ts$/.test(url.toString()),
        }),
    ],
};
