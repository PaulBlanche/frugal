# Add some scripts

Our page is only missing javascript in The Holy Trinity of Web Development (CSS, HTML and javascript). Here again, we could insert some `<script>` tags pointing to an external `.js` script, but again doing so we lose some of the power of incremental generation. Each change to the external `.js` script will not be seen by frugal, and the page using it will not be rebuilt. Plus we might want to do some transpilation, minification and bundling.

## Script loader

In `frugal.config.ts`, add the [script loader](/docs/api/02-script-loader) :

```ts
//...
import { ScriptLoader } from 'https://deno.land/x/frugal/loader_script.ts';

export const config: frugal.Config = {
    //...
    loader: [
        //...
        new ScriptLoader({
            bundles: [{
                name: 'body',
                test: (url) => /\.script\.ts?$/.test(url.toString()),
            }],
            format: 'esm',
            minify: true,
            splitting: true,
            sourcemap: true,
        }),
    ],
};
```

Again, the loader takes a test function to detect module to include in its bundle. Here we include any module ending in `.script.ts`.

## Script module

We can now write a script module (`/pages/post/detail.script.ts` for exemple) :

```ts
const ID = 'my-id';

export function main() {
    document.getElementById(ID)!.addEventListener('click', () => {
        console.log('clicked !');
    });
}
```

A script module must export a `main` function. This function will be called in the generated bundle, so think of it as your entry point.

You can now use the script module in your page descriptor :

```ts
import { ID } from './detail.script.ts';

function getContent() {
    return `<div>
        <button id="${ID}">click me</button>
    </div>`;
}
```

Since now your script module is imported, frugal can see any modification done to the script and do incremental generation correctly. If you change something in a sc ript module, frugal will rebuild any page that uses it.

[warn]> Since your script module is imported in your page descriptor, keep in mind that everything you do on top level of your script module will be executed when you rune frugal (at build time or runtime if you use frugal server). This is usefull to share constants (like the `ID` constant) with the generated markup, but try not to execute anything. For static website, this will just make the build longer, but for frugal server it will delay server startup, which is especially bad in serverless context.
[warn]>
[warn]> **Rule of thumb** : only execute anything in the `main` function, and only declare things (constants, functions) on top level.

## Include the generated stylesheet

The `getContent` function will recive a `loaderContext` object that contains data that the loaders have generated. For the script loader, there will be one version of the bundle for each page :

```ts
async function getContent(params: frugal.GetContentParams<Path, Post>) {
    const bodyBundleUrl =
        params.loaderContext.get('script')[params.descriptor]['body'];

    return `<html>
        ...
        <body>
            ...
            <script type="module" src="${bodyBundleUrl}"></script>
        </body>
    </html>`;
}
```
