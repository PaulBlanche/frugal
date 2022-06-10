# Script loader

The script loader is used to generate bundle of javascript code executed on the browser. Every module targeted by this loader should export a `main()` function :

```ts
export function main() {
    console.log('Hello world');
}
```

This function will be called in the generated bundle, so think of it as the top level of your script.

This means you can have the following script

```ts
export const ID = 'my-id';

export function main() {
    const element = document.getElementById(ID);
    element.textContent = 'Hello world';
}
```

that exposes an `ID` that can be used in the generated markup :

```ts
import { ID } from './hello-world.script.ts';

export function MyComponent() {
    return `<p id=${ID}></p>`;
}
```

That way you can couple scripts and html easily without having to keep ids
synchronised through the codebase.

During the bundling process, only the `main` function will be imported. This means that any code outside of the `main` function and not used in the `main` function will not be bundled (thanks to tree-shaking).

## Bundling

Under the hood, the script loader uses [`esbuild`](https://esbuild.github.io). This means that you could enable code splitting and minification, or use any other option [`esbuild` supports](https://esbuild.github.io/api/#build-api)

> ⚠️ Since esbuild does not transform code lower than ES6, only ES6-compatible browser will be able to execute it. If you want code splitting, only browsers able to execute ES6 modules will be able to execute it. `esbuild` does not polyfill missing features, you will have to do it yourself with [`core-js`](https://github.com/zloirock/core-js).
>
> If you want to support older browser, you can leverage form submission and `postDynamicData` to have server-side functionnality.

The script loader will generate a bundle for each page descriptor. If a page descriptor `a` imports some scripts `foo.script.ts` and `bar.script.ts` and a page descriptor only import `foo.script.ts`, and those scripts matches the bundle `'body'`, you should get two output bundles :

- a bundle `'body'` for the page descriptor `a` containing `foo.script.ts` and `bar.script.ts`
- a bundle `'body'` for the page descriptor `b` containing `foo.script.ts`.

The script loader will provide to the `loaderContext` an object with this shape : `{ [descriptor]: { [format]: src } }`. You can therefore get the url of a bundle in the `getContent` function of your [page descriptor](/docs/concepts/page-descriptor) :

```ts
export function getContent(
    { loaderContext, descriptor }: frugal.GetContentParams<Path, Data>,
) {
    const scriptUrl = loaderContext.get('script')[descriptor]['body'];

    // ...
}
```

You can define mutliple bundles. For exemple if you want to have a bundle `'body'` for scripts that goes in the body, and a bundle `'head'` for scripts that goes in the head, you can define two bundles :

```ts
new ScriptLoader({
    bundles: [{
        name: 'body',
        test: (url) => /\.script\.ts$/.test(url.toString()),
    }, {
        name: 'head',
        test: (url) => /\.head-script\.ts$/.test(url.toString()),
    }],
    formats: ['esm'],
    minify: true,
    splitting: true,
});
```

In the `getContent` method of your page descriptor, you can then get the `url` of the genrated bundles in `loaderContext` :

```ts
export function getContent(
    { descriptor, loaderContext }: frugal.GetContentParams<any, string>,
) {
    const bodyScriptUrl = loaderContext.get('script')[descriptor]['body'];
    const headScriptUrl = loaderContext.get('script')[descriptor]['head'];

    // ...
}
```
