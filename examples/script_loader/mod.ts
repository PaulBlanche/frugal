import { build } from '../../packages/core/mod.ts';
import { script } from '../../packages/loader_script/mod.ts';
import * as path from '../../dep/std/path.ts';

const ROOT = path.dirname(new URL(import.meta.url).pathname);

build({
    root: ROOT,
    outputDir: './dist',
    loaders: [
        script({
            name: 'body',
            test: (url) => /\.script\.ts$/.test(url.toString()),
            format: ['esm'],
        }),
    ],
    pages: [
        './page1.ts',
        './page2.ts',
    ],
});

declare global {
    interface Crypto {
        randomUUID: () => string;
    }
}
