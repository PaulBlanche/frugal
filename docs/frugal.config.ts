import { Config, page } from './dep/frugal/core.ts';
import { script } from './dep/frugal/loader_script.ts';
import { style, styleTransformer } from './dep/frugal/loader_style.ts';
import * as stylis from './dep/stylis.ts';
import { svg } from './dep/frugal/loader_jsx_svg.ts';
import * as preact from 'preact';
import { render } from 'preact-render-to-string';

import * as home from './pages/home/mod.ts';
import * as docs from './pages/docs/mod.ts';
import * as example from './pages/example/mod.ts';

const self = new URL(import.meta.url);
const importMap = new URL('./import_map.json', self).pathname;

export const config: Config = {
    self: new URL(import.meta.url),
    outputDir: './dist',
    importMap,
    loaders: [
        script({
            name: 'body',
            test: IS_SCRIPT_FILE,
            transformers: [{
                test: IS_STYLE_FILE,
                transform: styleTransformer,
            }],
            importMapFile: importMap,
            formats: ['esm'],
            minify: true,
            bundle: true,
            splitting: true,
        }),
        style({
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
            render,
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
        },
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
