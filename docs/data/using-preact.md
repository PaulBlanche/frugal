# Using Preact

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

## Preact server-side

To use preact at build time or on the server, you only need to use the `getContentFrom` function in your page descriptor :

```tsx
import { getContentFrom } from 'https://deno.land/x/frugal/packages/frugal_preact/mod.server.ts';

import { Page } from './Page.tsx';

export const getContent = getContentFrom(Page);
```

The `getContentFrom` will return a `getContent` function of a [page descriptor](/docs/concepts/page-descriptor) from a Preact component (here the `Page` component).

With this, your are set to write any JSX you want in the `Page` component. It will be rendered to html in the `getContentFrom`. The renderer does not handle `<Suspense>`.

## Preact client-side

First, since we want to bundle script, you need to setup the [script loader](/docs/concepts/loaders/script-loader).

Then, you need to create a _Island_ version of the component you want to execute client-side :

```tsx
/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { Island } from 'https://deno.land/x/frugal/packages/frugal_preact/mod.client.ts';

import { MyComponent, MyComponentProps } from './MyComponent.tsx';
import { NAME } from './MyComponent.script.ts';

export function MyComponentIsland(props: MyComponentProps) {
    return <Island props={props} Component={MyComponent} name={NAME} />;
}
```

When the `<Island>` component is rendered in the server or during the build, the `props` object is serialized and embeded in the generated html markup, to be picked up when the javascript client-side kicks in. This means the `props` object needs to be a JSON object.

You need to create a script module (the `./myComponent.script.ts` module in the previous code block, a module matching the [`script` loader](/docs/concepts/loaders/script-loader) pattern) that `hydrate` your module :

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

## Client-side only islands

By defautl, the component in the island is rendered server side to populate the html page. If you want your island to be rendered only client-side, you can disable rendering server side with the props `clientOnly` :

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
            clientOnly
            strategy='visible'
        />
    );
}
```

## Hooks

Preact integration comes with two hooks : `usePathname` and `useData`.

### `usePathname`

This hook will return the `pathname` of the current page. This is the compiled `pattern` of your page descriptor, with each paramater replaced with the value in the _path object_ used to generate the page.

For a page with the pattern `/:foo/:bar` that was rendered with the _path object_ `{{ foo: 'hello', bar: 'world' }`, the `pathname` will be `/hello/world`.

### `useData`

This hook will return the _data object_ used to generate the current page. To be passed to the _islands_, the _data object_ is serialized and embeded in the html as JSON. If you want to use `useData`, your _data object_ muste be serializable.

If you don't need access to the `data` in any of your _islands_ and don't want the extra weight of a serialized JSON in your html pages, you can disabled _data object_ embeding in the `getContentFrom` function :

```ts
export const getContent = getContentFrom(Page, {
    App,
    embedData: false,
});
```

You should use this hooks instead of relying on island props. Since the page _data object_ is embeded once for the whole page, it is better to use it instead of having bits derivred from this object embeded near each islands, leading to data duplication and heavier markup.

## Head component

Preact comes with a `<Head>` component that allows you to add tags to the `<head>` of the document in any components :

```tsx
import { Head } from 'https://deno.land/x/frugal/packages/frugal_preact/mod.client.ts';

export function MyComponent() {
    return (
        <div>
            <span>My Component</span>

            <Head>
                <title>My page title</title>
            </Head>
        </div>
    );
}
```
