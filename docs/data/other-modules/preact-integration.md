# Preact integration

## Preact server-side

To use preact at build time or on the server, you only need to use the `getContentFrom` function in your page descriptor :

```tsx
import { getContentFrom } from 'https://deno.land/x/frugal/packages/frugal_preact/mod.server.ts';

import { App } from './App.tsx';
import { Page } from './Page.tsx';

export function getRequestList() {
    return [{}];
}

export function getStaticData() {
    return {};
}

export const pattern = `/`;

export const self = new URL(import.meta.url);

export const getContent = getContentFrom(Page, { App });
```

The `getContentFrom` will return a `getContent` function of a [page descriptor](/docs/concepts/page-descriptor) from a Preact component (here the `Page` component). Additionaly, you can pass an `App` component that will wrap your component. This `App` component is the right place to set the `<link>` for stylesheet, using the `Head` component :

```tsx
/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import {
    AppProps,
    Head,
} from 'https://deno.land/x/frugal/packages/frugal_preact/mod.client.ts';

import './App.style.ts';

export function App({ entrypoint, loaderContext, children }: AppProps) {
    const esmBundleUrl = loaderContext.get('script')?.[entrypoint]?.['esm'];
    const styleUrl = loaderContext.get<string>('style');
    return (
        <>
            <Head>
                <meta charSet='utf-8' />
                <title>Page title</title>
                {styleUrl && <link rel='stylesheet' href={styleUrl} />}
            </Head>
            {children}
            {esmBundleUrl && <script module src={esmBundleUrl}></script>}
        </>
    );
}
```

With this, your are set to write any JSX you want in the `Page` component. It will be rendered to html in the `getContentFrom`. The renderer does not handle `<Suspense>`.

## Preact client-side

First, since we want to bundle script, you need to setup the [`script` loader](/docs/concepts/loaders/script-loader).

Then, you need to create a _Island_ version of the component you want to execute client-side :

```tsx
import { Island } from 'https://deno.land/x/frugal/packages/frugal_preact/mod.client.ts';
import { MyComponent, MyComponentProps } from './MyComponent.tsx';
import { NAME } from './MyComponent.script.ts';

export function MyComponentIsland(props: MyComponentProps) {
    return <Island props={props} Component={MyComponent} name={NAME} />;
}
```

When the `<Island>` component is rendered in the server or during the build, the `props` object is serialized and embeded in the generated html markup, to be picked up when the javascript client-side kicks in. This means the `props` object needs to be a JSON object.

You need to create a script module (a module matching the [`script` loader](/docs/concepts/loaders/script-loader) pattern) that `hydrate` your module (the `./myComponent.script.ts` module in the previous code block) :

```ts
import { MyComponent } from './MyComponent.tsx';
import { hydrate } from 'https://deno.land/x/frugal/packages/frugal_preact/mod.client.ts';

export const NAME = 'MyComponentIsland';

export function main() {
    hydrate(NAME, () => MyComponent);
}
```

The `NAME` export is the unique identifier for your component. It will be used by the `<Island>` component to uniquely identify the generated DOM node as "hydratable with the component MyComponent". The `hydrate` function will use the name to query all DOM nodes that need to be hydrated with `MyComponent`.

The `hydrate` function takes as parameter a function returning the component `() => MyComponent`, and not directly the component. This function can be async, leaving you the ability to dynamically import your component :

```ts
import { hydrate } from 'https://deno.land/x/frugal/packages/frugal_preact/mod.client.ts';

export const NAME = 'MyComponentIsland';

export function main() {
    hydrate(NAME, async () => (await import('./MyComponent.tsx')).MyComponent);
}
```

## Hydration strategy

By default an `Island` is hydrated on load. But you can instruct frugal to use another startegy.

### `idle` hydration strategy

The hydratation of the `idle` islands is defered with a `setTimeout` to be rendered as soon as the main thread is `idle` :

```tsx
import { Island } from 'https://deno.land/x/frugal/packages/frugal_preact/mod.client.ts';
import { MyComponent, MyComponentProps } from './MyComponent.tsx';
import { NAME } from './MyComponent.script.ts';

export function MyComponentIsland(props: MyComponentProps) {
    return (
        <Island
            props={props}
            Component={MyComponent}
            name={NAME}
            strategy='idle'
        />
    );
}
```

### `visible` hydration strategy

The hydration of the `visible` islands is defered with an `IntersectionObserver`. The hydration will kick in as soon as the component becomes visible. This can be coupled with a dynamic import of the component during hydration, to delay loading the bundle of the component.

```tsx
import { Island } from 'https://deno.land/x/frugal/packages/frugal_preact/mod.client.ts';
import { MyComponent, MyComponentProps } from './MyComponent.tsx';
import { NAME } from './MyComponent.script.ts';

export function MyComponentIsland(props: MyComponentProps) {
    return (
        <Island
            props={props}
            Component={MyComponent}
            name={NAME}
            strategy='visible'
        />
    );
}
```

### `media-query` hydration strategy

The hydration of the `media-query` islands kicks in if the client matches a given media-query on load. This strategy does not listen to `resize` events. This can be coupled with a dynamic import of the component during hydration, to avoid loading bundle that will not be hydrated on the client.

```tsx
import { Island } from 'https://deno.land/x/frugal/packages/frugal_preact/mod.client.ts';
import { MyComponent, MyComponentProps } from './MyComponent.tsx';
import { NAME } from './MyComponent.script.ts';

export function MyComponentIsland(props: MyComponentProps) {
    return (
        <Island
            props={props}
            Component={MyComponent}
            name={NAME}
            strategy='media-query'
            query='(min-width: 400px)'
        />
    );
}
```

## Hooks

Preact integration comes with two hooks : `usePathname` and `useData`.

### `usePathname`

This hook will return the `pathname` of the current page. This is the compiled `pattern` of your page descriptor, with each paramater replaced with the value in the _request object_ used to generate the page.

For a page with the pattern `/:foo/:bar` that was rendered with the request object `{{ foo: 'hello', bar: 'world' }`, the `pathname` will be `/hello/world`.

### `useData`

This hook will return the `data` used to generate the current page. To be passed to the _islands_, the `data` is serialized and embeded in the html as JSON. If you want to use `useData`, your `data` muste be serializable.

If you don't need access to the `data` in any of your _islands_ and don't want the extra weight of a serialized JSON in your html pages, you can disabled `data` embeding in the `getContentFrom` function :

```ts
export const getContent = getContentFrom(Page, {
    App,
    embedData: false,
});
```
