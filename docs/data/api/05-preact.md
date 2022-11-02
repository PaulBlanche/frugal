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
import { getContentFrom } from 'https://deno.land/x/frugal/preact.server.ts';

import { Page } from './Page.tsx';

export const getContent = getContentFrom(Page);
```

The `getContentFrom` will return a `getContent` function of a [page descriptor](/docs/concepts/page-descriptor) from a Preact component (here the `Page` component).

By default `getContentFrom` will embed the data object as a JSON object in the markup for island hydration. Therefore data object must be serializable.
You can lift this constraint if you don't have any island in your page (or don't use `useData` in any island) :

```ts
export const getContent = getContentFrom(Page, { embedData: false });
```

## `<Island>` component

The `<Island>` component wraps your component to make it hydratable

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

[warn]> Avoid importing `preact.server.ts` in your island, since this module contains server only code (using Deno api).

By default an `<Island>` is hydrated on load. But you can instruct frugal to use another strategy.

### `idle` hydration strategy

The hydration of the `idle` islands is deferred with a `setTimeout` to be rendered as soon as the main thread is `idle` :

```tsx
import { Island } from 'https://deno.land/x/frugal/preact.client.ts';
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

The hydration of the `visible` islands is deferred with an `IntersectionObserver`. The hydration will kick in as soon as the component becomes visible. This can be coupled with a dynamic import of the component during hydration, to delay loading the bundle of the component if you use code splitting.

```tsx
import { Island } from 'https://deno.land/x/frugal/preact.client.ts';
import { type MyComponentProps } from './MyComponent.tsx';
import { NAME } from './MyComponent.script.ts';

export function MyComponentIsland(props: MyComponentProps) {
    return (
        <Island
            props={props}
            Component={async () =>
                (await import('./MyComponent.tsx')).MyComponent}
            name={NAME}
            strategy='visible'
        />
    );
}
```

### `media-query` hydration strategy

The hydration of the `media-query` islands kicks in if the client matches a given media-query on load. This strategy does not listen to `resize` events. This can be coupled with a dynamic import of the component during hydration, to avoid loading bundle that will not be hydrated on the client.

```tsx
import { Island } from 'https://deno.land/x/frugal/preact.client.ts';
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

By default, the component in the island is rendered server side to populate the html page. If you want your island to be rendered only client-side, you can disable rendering server side with the props `clientOnly` :

```tsx
import { Island } from 'https://deno.land/x/frugal/preact.client.ts';
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

This hook will return the `pathname` of the current page. This is the compiled `pattern` of your page descriptor, with each parameter replaced with the value in the _path object_ used to generate the page.

For a page with the pattern `/:foo/:bar` that was rendered with the _path object_ `{{ foo: 'hello', bar: 'world' }`, the `pathname` will be `/hello/world`.

### `useData`

This hook will return the _data object_ used to generate the current page.

You should use this hooks instead of relying on island props. Since the page _data object_ is embedded once for the whole page, it is better to use it instead of having multiple derived values from this object embedded near each islands, leading to data duplication and heavier markup.

## Head component

Preact comes with a `<Head>` component that allows you to add tags to the `<head>` of the document in any components :

```tsx
import { Head } from 'https://deno.land/x/frugal/preact.client.ts';

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
