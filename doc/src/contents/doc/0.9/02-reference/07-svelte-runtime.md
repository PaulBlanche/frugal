# Svelte runtime

> [!warn]
> This feature is experimental. No extensive tests were done to ensure it works in all conditions, but it should work in most cases.

Frugal comes with an optional integration with Svelte. You can write your static markup with Svelte and declare _island_ for stateful components that need to be hydrated client-side.

## Configuration

First, you'll need an [Import Map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap). Frugal uses bare specifiers internally to avoid locking you with a specific version of peer dependencies: `import * as preact from 'preact'`. Those kinds of imports need to be "mapped" to actual URLs where you can choose the specific version you wish to use.

```json filename=import_map.json
{
    "imports": {
        "svelte/": "npm:/svelte@{{SVELTE_VERSION}}/",
        "svelte": "npm:/svelte@{{SVELTE_VERSION}}",
    }
}
```

You'll also need a `deno.json` [config file](https://deno.land/manual@v{{DENO_VERSIO}}/getting_started/configuration_file) to configure the Import Map:

```json filename=deno.json
{
    "importMap": "./import_map.json"
}
```

Now that deno is configured, we need to configure Frugal with the [svelte plugin](/doc@{{version}}/reference/plugins#heading-svelte-experimental):

```ts filename=frugal.config.ts
import { Config } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"
import { svelte } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/plugins/svelte.ts"

export default {
    ...
    plugin: [svelte()]
    ...
} satisfies Config;
```

Now frugal is ready to process Svelte components.

## Server-only runtime

Those functions can only be used in server-side components. They can't be used inside an _island_.

### `getRenderFrom`

The only thing that changes in page descriptors is the render function. Instead of defining it ourselves, the Svelte runtime compute a render function for us from a Svelte component:

```tsx filename=page.tsx
import { getRenderFrom } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/runtime/preact.server.ts"
import App from './App.svelte'

export const render = getRenderFrom(App)
```

#### Parameters

The `getRenderFrom` takes two parameters, the root Svelte Component and an optional config object `RenderConfig`

```ts
type RenderConfig = {
    document?: (head: string, body: string) => string;
    embedData?: boolean;
};
```

##### `document`

The root Svelte Component only describes markup inside the body. To modify the rest of the document, you can pass a function taking the content of the `<head>` tag and the content of the `<body>` tag that returns the entire document.

> [!tip]
> If you want to modify the `<head>` of the document, use the [`<svelte:head>`](https://svelte.dev/docs/special-elements#svelte-head) component instead.

##### `embedData`

By default, Frugal outputs static pages without any client-side script. But if you have client-side _island_, you might need access to the data object that was used to render the page in the server. The `embedData` parameter instructs Frugal to embed the data object in an inline script for you to access via [`getData`](/doc@{{version}}/reference/svelte-runtime#heading-getdata)

> [!warn]
> You will get an error if you call the function `getData` inside an _island_ with `embedData: false`. You must have `embedData: true` for the function to work client-side.

## Client-safe runtime

Every components, hooks, or method described here are usable inside server components or _island_. You can use them everywhere.

### `<Island>`

Wrapping your stateful client-side component in the `<Island>` component will create an _island_. The `<Island>` component will output all the necessary markup to hydrate the component client-side.

```svelte filename=MyComponentIsland.svelte
<script>
    import { Island } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/runtime/svelte.client.ts"
    import MyComponent from './MyComponent.svelte'
    import { NAME } from "./MyComponentIsland.script.ts"
</script>

<Island name={NAME} component={Counter} {$$props}>
    <slot />
</Island>
```

> [!warn]
> The `<Island>` component does not perform any hydration; it only generates the markup necessary for hydration. The hydration is done via a client-side call to the [`hydrate`](/doc@{{version}}/reference/svelte-runtime#heading-hydrate) function.

The component accepts the following props:

#### `strategy`

This prop selects the hydration strategy for the island:

- `"load"` will hydrate the island on page load (default behavior)
- `"idle"` will defer hydration until the browser is idle (via `requestIdleCallback` or `setTimeout` for browsers not supporting it)
- `"visible"` will defer hydration until the island enters the viewport (via `InsersectionObserver`)
- `"media-query"` will hydrate the island if the viewport matches a given media query on load
- `"never"` will turn off hydration for this island

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
import { hydrate } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/runtime/svelte.client.ts"
import MyComponent from "./MyComponent.svelte"

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
    hydrate(NAME, () => (await import('./MyComponent.svelte')).default)
}
```

The JS chunk containing your component will not be loaded immediately. Instead, it will be deferred until the island is hydrated.

### `getData`

This function gives you access to the data object of the page within any Svelte component.

> [!warn]
> For this function to work client-side, you need `embedData:true` in the [`getRenderFrom`](/doc@{{version}}/reference/svelte-runtime#heading-getrenderfrom) function.

### `getPathname`

This function gives you access to the current pathname (the `route` of the page, compiled with the current path object).
