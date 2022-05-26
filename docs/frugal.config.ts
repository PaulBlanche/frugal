import { page, UpstashPersistance } from './dep/frugal/core.ts';
import { Config } from './dep/frugal/frugal_oak.ts';
import { ScriptLoader } from './dep/frugal/loader_script.ts';
import { StyleLoader, styleTransformer } from './dep/frugal/loader_style.ts';
import * as stylis from './dep/stylis.ts';
import { svg, svgTransformer } from './dep/frugal/loader_jsx_svg.ts';
import * as preact from 'preact';

import * as home from './pages/home/mod.ts';
import * as docs from './pages/docs/mod.ts';
import * as example from './pages/example/mod.ts';

const self = new URL(import.meta.url);

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
            minify: true,
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

    //'https://eu1-intense-kodiak-36255.upstash.io'
    // 'AY2fACQgMDUyZDkwZjktMWMwZS00NDdiLWFmOTktODIzOTVkZmY3YzQxZDliOTkxNWJjNmFhNDZkZWFiNjEwODc5ZDU3N2MwZDM=',

    sessionPersistance: new UpstashPersistance(
        Deno.env.get('UPSTASH_URL') ?? '',
        Deno.env.get('UPSTASH_TOKEN') ?? '',
    ),

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

            'frugal_oak:DynamicRouter': 'DEBUG',
            'frugal_oak:DynamicRouter:generateMiddleware': 'DEBUG',
            'frugal_oak:PrgOrchestrator': 'DEBUG',
            'frugal_oak:PrgOrchestrator:postMiddleware': 'DEBUG',
            'frugal_oak:PrgOrchestrator:getRedirectionMiddleware': 'DEBUG',
            'frugal_oak:staticFileMiddleware': 'DEBUG',
            'frugal_oak:staticFileMiddleware:filesystemMiddleware': 'DEBUG',
            'frugal_oak:staticFileMiddleware:autoIndexMiddleware': 'DEBUG',
            'frugal_oak:StaticRouter': 'DEBUG',
            'frugal_oak:StaticRouter:forceRefreshMiddleware': 'DEBUG',
            'frugal_oak:StaticRouter:cachedMiddleware': 'DEBUG',
            'frugal_oak:StaticRouter:refreshJitMiddleware': 'DEBUG',
        },
    },

    listen: { port: 8000 },
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
