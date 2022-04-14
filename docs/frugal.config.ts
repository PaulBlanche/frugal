import { Config, page } from '../packages/core/mod.ts';
import { script } from '../packages/loader_script/mod.ts';
import { rollupImportMapPlugin } from '../dep/rollup-plugin-import-map.ts';
import { style } from '../packages/loader_style/mod.ts';
import { style as rollupStylePlugin } from '../packages/loader_style/rollup-style-plugin.ts';
import * as stylis from '../dep/stylis.ts';
import { svg } from '../packages/loader_jsx_svg/mod.ts';
import * as home from './pages/home/mod.ts';
import * as docs from './pages/docs/mod.ts';
import * as preact from 'preact';
import { render } from 'preact-render-to-string';

const self = new URL(import.meta.url);
const importMap = new URL('../import_map.json', self).pathname;

export const config: Config = {
    self: new URL(import.meta.url),
    outputDir: './dist',
    importMap,
    loaders: [
        script({
            name: 'body',
            test: IS_SCRIPT_FILE,
            input: {
                plugins: [
                    rollupStylePlugin({
                        test: IS_STYLE_FILE,
                    }),
                    rollupImportMapPlugin({
                        maps: importMap,
                    }) as any,
                ],
            },
            outputs: [{
                format: 'esm',
            }],
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
