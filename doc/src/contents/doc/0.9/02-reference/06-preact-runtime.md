# Preact runtime

Frugal comes with an optional integration with Preact. You can write your static markup with JSX and declare _island_ for stateful components that need to be hydrated client-side.

## Configuration

First, you'll need an [Import Map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap). Frugal uses bare specifiers internally to avoid locking you with a specific version of peer dependencies: `import * as preact from 'preact'`. Those kinds of imports need to be "mapped" to actual URLs where you can choose the specific version you wish to use.

```json filename=import_map.json
{
    "imports": {
        "preact": "https://esm.sh/preact@{{PREACT_VERSION}}",
        "preact/": "https://esm.sh/preact@{{PREACT_VERSION}}/",
        "preact-render-to-string": "https://esm.sh/preact-render-to-string@{{PREACT_RENDER_VERSION}}?external=preact"
    }
}
```

You'll also need a `deno.json` [config file](https://deno.land/manual@v{{DENO_VERSION}}/getting_started/configuration_file) to configure the JSX and the Import Map:

```json filename=deno.json
{
    "compilerOptions": {
        "jsx": "react-jsx",
        "jsxImportSource": "preact"
    },
    "importMap": "./import_map.json"
}
```

Now that Deno is configured to understand `jsx` correctly, we need to configure Frugal:

```ts filename=frugal.config.ts
import { Config } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"

export default {
    ...
    esbuild: {
        ...
        jsx: "automatic",
        jsxImportSource: "preact",
    },
    ...
} satisfies Config;
```

Now frugal is ready to process JSX using Preact.

## Server-only runtime

Those functions can only be used in server-side components. They can't be used inside an _island_.

### `getRenderFrom`

The only thing that changes in page descriptors is the render function. Instead of defining it ourselves, the preact runtime computes a render function for us from a JSX component:

```tsx filename=page.tsx
import { getRenderFrom } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/runtime/preact.server.ts"

export const render = getRenderFrom(App)

function App() {
    return <h1>Hello World !</h1>
}
```

#### Parameters

The `getRenderFrom` takes two parameters, the root JSX component and an optional config object `RenderConfig`

```ts
type RenderConfig = {
    Document?: preact.ComponentType<DocumentProps>;
    embedData?: boolean;
};

export type DocumentProps = {
    head: preact.VNode[];
    descriptor: string;
    assets: descriptor.Assets;
    dangerouslySetInnerHTML: { __html: string };
};
```

##### `Document`

The root JSX component only describes markup inside the body. To modify the rest of the document, you can pass a JSX Component that takes `DocumentProps`.

> [!tip]
> If you want to modify the `<head>` of the document, use the [`<Head>`](/doc@{{version}}/reference/preact-runtime#heading-head) component instead.

##### `embedData`

By default, Frugal outputs static pages without any client-side script. But if you have client-side _island_, you might need access to the data object used to render the page server-side. The `embedData` parameter instructs Frugal to embed the data object in an inline script for you to access via [`useData`](/doc@{{version}}/reference/preact-runtime#heading-usedata)

> [!warn]
> You will get an error if you call the hook `useData` inside an _island_ with `embedData: false`. You must have `embedData: true` for the hook to work client-side.

## Client-safe runtime

Every components, hooks, or method described here are usable inside server components or _island_. You can use them everywhere.

### `<Island>`

Wrapping your stateful client-side component in the `<Island>` component will create an _island_. The `<Island>` component will output all the necessary markup to hydrate the component client-side.

```tsx filename=MyComponentIsland.tsx
import { Island } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/runtime/preact.client.ts"
import { MyComponent, MyComponentProps } from './MyComponent.tsx'
import { NAME } from "./MyComponentIsland.script.ts"

function MyComponentIsland(props: MyComponentProps) {
    return <Island Component={MyComponent} props={props} name={NAME} />
}
```

> [!warn]
> The `<Island>` component does not perform any hydration; it only generates the markup necessary for hydration. The hydration is done via a client-side call to the [`hydrate`](/doc@{{version}}/reference/preact-runtime#heading-hydrate) function.

The component accepts the following props:

```ts
export type IslandProps<PROPS> = {
    strategy?: HydrationStrategy;
    clientOnly?: boolean;
    query?: string;
    name: string;
    Component: preact.ComponentType<PROPS>;
    props: preact.RenderableProps<PROPS>;
};

export type HydrationStrategy = "load" | "idle" | "visible" | "media-query" | "never";
```

#### `strategy`

This prop selects the hydration strategy for the island:

- `"load"` will hydrate the island on page load (default behavior)
- `"idle"` will defer hydration until the browser is idle (via `requestIdleCallback` or `setTimeout` for browsers not supporting it)
- `"visible"` will defer hydration until the island enters the viewport (via `InsersectionObserver`)
- `"media-query"` will hydrate the island if the viewport matches a given media query on load
- `"never"` will turn off hydration for this island

#### `clientOnly`

This prop will disable SSR for the _island_. No markup will be generated in the HTML, and the component will only render client-side (for browsers able to process the javascript)

#### `query`

The media query to match if you chose the `"media-query"` strategy.

#### `name`

A unique name for your island. This name will be used as a selector to find the DOM node to hydrate.

#### `Component`

Your stateful client-side component inside the island.

#### `props`

The props passed to your component.

> [!warn]
> The props of your component will be serialized and embedded in the HTML markup, so the props must be serializable
>
> Moreover, if you have multiple instances of the same island on the page and the props are derived from the page data object, it might be more efficient to have an island without props and to use `useData` with `embedData:true` to compute the props from the data object. Instead of having a JSON of the props embedded for each instance of your island, you'll have a single JSON of the data object embedded. You'll have to decide what option is the best fit for your case.

### `hydrate`

This is the function to call client-side (inside a _script_) to hydrate an `<Island>`:

```ts filename=MyComponentIsland.script.ts
import { hydrate } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/runtime/preact.client.ts"
import { MyComponent } from "./MyComponent.tsx"

export const NAME = "MyComponent";

if (import.meta.environment === 'client') {
    hydrate(NAME, () => MyComponent)
}
```

This function will find every _island_ with a matching name and hydrate them with the component `MyComponent`.

#### Parameters

The `hydrate` function takes two parameters. The name of the island to hydrate and a function (sync or async) returning a component.

#### Dynamic import and deferred hydration

The second parameter of the `hydrate` function can be an async callback to enable dynamic loading of components with code-splitting. Since the `hydrate` function calls the callback parameter only during actual hydration, for Islands with deferred hydration (`"idle"`, `"visible"`, `"media-query"`) you can use this pattern with code splitting enabled (via [esbuild config](/doc@{{FRUGAL_CONFIG}}/reference/configuration#heading-esbuild)):

```ts filename=MyComponentIsland.script.ts
import { hydrate } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/runtime/preact.client.ts"

export const NAME = "MyComponent";

if (import.meta.environment === 'client') {
    hydrate(NAME, () => (await import('./MyComponent.tsx')).MyComponent)
}
```

The JS chunk containing your component will not be loaded immediately. Instead, it will be deferred until the island is hydrated.

### `<Head>`

This component allows you to change the `<head>` content and the attributes of `<html>` and `<body>` from everywhere in your JSX:

```tsx filename=Component.tsx
import { Head } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/runtime/preact.client.ts"

function Component() {
    return <>
        <Head>
            {/* any tag inside the <head> */}
            <title>Title of my Page</title>
            {/* html tag attributes */}
            <html lang="en" amp />
            {/* body tag attributes */}
            <body class="root" />
        </Head>
    </>
}
```

### `useData`

This hook gives you access to the data object of the page.

> [!warn]
> For this hook to work client-side, you need `embedData:true` in the [`getRenderFrom`](/doc@{{version}}/reference/preact-runtime#heading-getrenderfrom) function.

### `usePathname`

This hook gives you access to the current pathname (the `route` of the page, compiled with the current path object).
