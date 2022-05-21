# Style loader

The `style` loader works with the `styled` utility (a clone of the api of `styled-component`). Every module targeted by this loader should export classnames, generated with the `styled` utility :

```tsx
import { className } from 'https://deno.land/x/frugal/packages/loader_style/styled.ts';

export const item = className('item').styled`
    color: red;
`;

export const list = className('list').styled`
    padding: 0;
`;
```

If this module is caught by the `style` loader (meaning its name matches the loader pattern), the following css will be generated :

```css
.item-l6cy2y {
    color: red;
}

.list-vngyoe {
    padding: 0
}
```

the `style` loader will generate unique classnames. You can control the prefix of the classname, for easier debugging. Those class will be ordered by declaration order :

- within the same module, classnames declared first are outputed first
- amongst modules, classnames from modules imported first are outputed first.

The `style` loader will provide to the `loaderContext` a string containing the url of the generated css file. You can therefore get the url of the css file in the `getContent` function of your [page descriptor](/docs/concepts/page-descriptor) :

```ts
export function getContent(
    { loaderContext, entrypoint }: frugal.GetContentParams<Path, Data>,
) {
    const cssFileUrl = loaderContext.get('style');

    // ...
}
```

## Transformer

The `style` loader has no notion of css syntax, it simply aggregates what is given to him. This means that you can "customize" the flavor of css you want, via the `transform` function. Here for example, we use the `stylis` preprocessor :

```ts
import { Config, page } from '../packages/core/mod.ts';
import * as myPage from './pages/myPage.ts';
import * as stylis from 'https://esm.sh/stylis@4.0.13';
import { StyleLoader } from 'https://deno.land/x/frugal/packages/loader_style/mod.ts';

const self = new URL(import.meta.url);

export const config: Config = {
    self,
    outputDir: './dist',
    pages: [
        page(myPage),
    ],
    loader: [
        new StyleLoader({
            test: (url) => /\.style\.ts$/.test(url.toString()),
            transform: (content) => {
                return stylis.serialize(
                    stylis.compile(content),
                    stylis.middleware([stylis.prefixer, stylis.stringify]),
                );
            },
        }),
    ],
};
```

With this setup, the following module, using non-standard syntax :

```tsx
import { className } from 'https://deno.land/x/frugal/packages/loader_style/styled.ts';

export const item = className('item').styled`
    color: red;
`;

export const list = className('list').styled`
    padding: 0;

    ${item} {
        color: blue;
    }
`;
```

should output the following style

```css
.item-l6cy2y {
    color: red;
}

.list-vngyoe {
    padding: 0
}

.list-vngyoe .item-l6cy2y {
    padding: 0
}
```
