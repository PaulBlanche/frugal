import * as preact from 'preact';

import { page, UpstashPersistance } from './dep/frugal/core.ts';
import { Config } from './dep/frugal/server.ts';
import { ScriptLoader } from './dep/frugal/loader_script.ts';
import { StyleLoader, styleTransformer } from './dep/frugal/loader_style.ts';
import * as stylis from './dep/stylis.ts';
import { svg, svgTransformer } from './dep/frugal/loader_jsx_svg.ts';

import * as home from './pages/home/mod.ts';
import * as docs from './pages/docs/mod.ts';
import * as example from './pages/example/mod.ts';

const self = new URL(import.meta.url);

const SESSION_PERSISTANCE = new UpstashPersistance(
    Deno.env.get('UPSTASH_URL') ?? '',
    Deno.env.get('UPSTASH_TOKEN') ?? '',
);

export const config: Config = {
    self,
    outputDir: './dist',
    importMap: '../import_map.json',
    loaders: [
        new ScriptLoader({
            bundles: [{
                name: 'body',
                test: IS_SCRIPT_FILE,
            }],
            transformers: [{
                test: IS_STYLE_FILE,
                transform: styleTransformer,
            }, {
                test: IS_SVG,
                transform: svgTransformer,
            }],
            format: 'esm',
            minify: false,
            splitting: true,
            sourcemap: true,
        }),
        new StyleLoader({
            test: IS_STYLE_FILE,
            transform: (bundle) => {
                return stylis.serialize(
                    stylis.compile(bundle),
                    stylis.middleware([stylis.prefixer, stylis.stringify]),
                );
            },
        }),
        svg({
            test: IS_SVG,
            jsx: preact.h,
        }),
    ],

    pages: [
        page(home),
        page(docs),
        page(example),
    ],

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
            'frugal_server:statusRewriteMiddleware': 'DEBUG',
            'frugal_server:FrugalServer': 'DEBUG',
        },
    },

    server: {
        sessionPersistance: SESSION_PERSISTANCE,

        listen: { port: 8000 },
    },
};

function IS_STYLE_FILE(url: URL | string) {
    return /\.style\.ts$/.test(url.toString());
}

function IS_SCRIPT_FILE(url: URL | string) {
    return /\.script\.ts$/.test(url.toString());
}

function IS_SVG(url: URL | string) {
    return /\.svg\.[tj]sx?$/.test(url.toString());
}
