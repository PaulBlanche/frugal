# Loader

By default, frugal only outputs text files containing html markup. But a website is made form other static assets, like style from a `.css` file or a script from a `.js` file.

Frugal delegates to loader the responsibility of generating those assets.

Each loader defines a pattern, and frugal will provide all imported modules matching this pattern to the loader.

For example, with the given `frugal.config.ts` :

```ts
import { Config, page } from '../packages/core/mod.ts';
import * as myPage from './pages/myPage.ts';
import { style } from 'https://deno.land/x/frugal/packages/loader_style/mod.ts';

const self = new URL(import.meta.url);

export const config: Config = {
    self,
    outputDir: './dist',
    pages: [
        page(myPage),
    ],
    loader: [style({
        test: (url) => /\.style\.ts$/.test(url.toString()),
    })],
};
```

frugal will find in `./pages/myPage.ts` or in any of its dependencies any modules ending with `.style.ts`, and provide them to the `style` loader.

Then the loader, according to its own logic, will generate some static assets from those modules.
