# Using preact

Frugal comes with optional integration with [Preact](https://preactjs.com/). You can use it on the server or at build time (as a template engine) or on the client through [island of interactivity](https://jasonformat.com/islands-architecture/)

Preact integration rely on you providing the preact version you want via an [import map](https://deno.land/manual/linking_to_external_code/import_maps) :

```json
{
    "imports": {
        "preact": "https://esm.sh/preact@10.11.2",
        "preact/jsx-runtime": "https://esm.sh/preact@10.11.2/jsx-runtime",
        "preact/hooks": "https://esm.sh/preact@10.11.2/hooks",
        "preact-render-to-string": "https://esm.sh/preact-render-to-string@5.2.5?deps=preact@10.11.2"
    }
}
```

This means you provide the version of preact that suits you, and frugal will use it.

## Preact server side or at build time

To use preact at build time or on the server, you only need to use the `getContentFrom` function in your page descriptor :

```tsx
import { getContentFrom } from 'https://deno.land/x/frugal/preact.server.ts';
import { Page } from './Page.tsx';

//...

export const getContent = getContentFrom(Page);
```

The `getContentFrom` will return a `getContent` function of a [page descriptor](/docs/api/01-page-descriptor) from a Preact component (here the `Page` component).

[warn]> The data object returned by your data fecthing methods (`getStaticData`, `getDynamicData` and `handlers`) will be embedded as JSON in the generated markup for islands. This means that the data object needs to be serializable.

The `Page` component will recive in its props the `loaderContext` for you to inject any style or script loaded by frugal :

```tsx
import { Head, PageProps } from 'https://deno.land/x/frugal/preact.server.ts';

export function Page({ loaderContext }: PageProps) {
    const bodyBundleUrl = loaderContext.get('script')[descriptor].['body'];
    const styleUrl = loaderContext.get('style');

    return <>
        <Head>
            <link rel='stylesheet' href={styleUrl} />
        </Head>
        {/* ... */}
        <script async type='module' src={bodyBundleUrl}></script>
    </>
}
```

The `<Head>` component allows you to set what's in the `<head>` of your page from everywhere in your component tree.

## `useData` and `usePathname` hooks

Integration with preact commes with two hooks `useData` and `usePathname` that will return the current data object and the current pathname :

```tsx
import {
    useData,
    usePathname,
} from 'https://deno.land/x/frugal/preact.client.ts';
import { type Data } from '../types.ts';

export function MyComponent() {
    const data = useData<Data>();
    const pathname = usePathname();
}
```

Those hooks work both server side (inside standard components) and client-side (inside islands).

## Preact client side with islands

First, you need to creat an _island_ version of your component (by convention, use the `.island.tsx` suffix) :

```tsx
/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { Island } from 'https://deno.land/x/frugal/preact.client.ts';

import { MyComponent, MyComponentProps } from './MyComponent.tsx';
import { NAME } from './MyComponent.script.ts';

export function MyComponentIsland(props: MyComponentProps) {
    return <Island props={props} Component={MyComponent} name={NAME} />;
}
```

[warn]> The props object passed to the `<Island>` component will be embedded as JSON in the generated markup for islands. This means that the props object needs to be serializable.

[info]> Since the data object for the page is also serialized and injected in the html markup avoid passing a `props` object to the island if you could use `useData` instead. This will keep the html markup of the page light.

Defining the island is not enough, we need to hydrate it client-side. Since it is a client-side action, we need to use a script module :

You need to create a script module (the `./MyComponent.script.ts` module in the previous code block, a module matching the [`script` loader](/docs/api/02-script-loader) pattern) that `hydrate` your component :

```ts
import { MyComponent } from './MyComponent.tsx';
import { hydrate } from 'https://deno.land/x/frugal/preact.client.ts';

export const NAME = 'MyComponentIsland';

export function main() {
    hydrate(NAME, () => MyComponent);
}
```

The `NAME` export is the unique identifier for your component. It will be used by the `<Island>` component to uniquely identify the generated DOM node as _"hydratable with the component `MyComponent`"_. The `hydrate` function will use this name to query all DOM nodes that need to be hydrated with `MyComponent`.

[warn]> The `hydrate` function takes as parameter a function returning the component `() => MyComponent`, and not directly the component. This is done to work with [hydration-strategy](/docs/api/05-preact#Island-component)
