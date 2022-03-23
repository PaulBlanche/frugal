import { build } from '../../packages/core/mod.ts';
import * as path from '../../dep/std/path.ts';
import { script } from '../../packages/loader_script/mod.ts';
import { style } from '../../packages/loader_style/mod.ts';
import { style as rollupStylePlugin } from '../../packages/loader_style/rollup-style-plugin.ts';
import { rollupImportMapPlugin } from '../../dep/rollup-plugin-import-map.ts';

const ROOT = path.dirname(new URL(import.meta.url).pathname);

const IMPORT_MAP = path.resolve(ROOT, '../../import_map.json');

build({
    // since deno does not have any notion of "root of module", frugal needs to
    // rely on you giving a root directory. Every relative path in the
    // configuration will be resolved relative to this directory.
    root: ROOT,

    // the directory relative to `root` where to output the result of the build
    outputDir: './dist',

    // an import map file, relative to `root`. This is needed for preact integration
    // to let you define the version of preact you wish to use. The `frugal_preact`
    // module use bare imports `preact`, `preact/hooks` and `preact-render-to-string`.
    importMap: IMPORT_MAP,

    // registered loaders. We register the script loader withe the name "body",
    // and configured to catch all import ending in `.script.ts`. The bundles
    // will be outputed in `esm` format and with code splitting.
    // see the `script_loader` example for more info.
    loaders: [
        script({
            name: 'body',
            test: (url) => /\.script\.ts$/.test(url.toString()),
            input: {
                plugins: [
                    // Since we use an import map to resolve bare imports, we need
                    // to make rollup aware of this resolution logic.
                    rollupImportMapPlugin({
                        maps: IMPORT_MAP,
                    }) as any,
                    // We need to make rollup aware of the style bundle, in order
                    // to have only the classnames in the bundle and not the whole
                    // style
                    rollupStylePlugin({
                        test: (url) => /\.style\.ts$/.test(url.toString()),
                    }),
                ],
            },
            outputs: [{
                format: 'esm',
            }],
        }),
        style({
            test: (url) => /\.style\.ts$/.test(url.toString()),

            // The transform function allows you to use any flavor of css you want.
            // You can use postcss/less/sass to transform nested selectors, to
            // auto-prefix properties, etc ...
            transform: (bundle) => {
                return `/* comment injected by transform function */\n${bundle}`;
            },
        }),
    ],

    // the pages that need to be built
    pages: [
        './page.ts',
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
