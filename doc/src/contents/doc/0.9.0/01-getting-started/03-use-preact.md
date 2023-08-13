# Use Preact

## Update the configuration

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

You'll also need a `deno.json` [config file](https://deno.land/manual@v1.35.3/getting_started/configuration_file) to configure `jsx` :

```json filename=deno.json
{
    "compilerOptions": {
        "jsx": "react-jsx",
        "jsxImportSource": "preact"
    },
    "importMap": "./import_map.json"
}
```

Now that deno is configured to understand `jsx` correctly, we need to update the `frugal.config.ts` file :

```ts filename=frugal.config.ts lines=[6-10]
import { Config } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"

export default {
    self: import.meta.url,
    pages: ['pages/home.ts', 'pages/posts.ts'],
    importMap: "./import_map.json",
    esbuild: {
        jsx: "automatic",
        jsxImportSource: "preact",
    },
} satisfies Config;
```

Frugal uses [esbuild](https://esbuild.github.io/) under the hood. The `esbuild` entry allows you to pass some options to esbuild. Here we are configuring esbuild the same way we did Deno for it to understand `jsx` syntax correctly.

Since we use an Import Map, we must also pass it to Frugal.

## Update the post page

First, we move our markup in a jsx component in a `pages/Page.tsx` module :

```tsx filename=pages/PostPage.tsx
import { PageProps, useData, Head } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/runtime/preact.server.ts"

export function PostPage({ assets, descriptor }: PageProps) {
    const styleHref = assets["style"][descriptor]}

    const data = useData<{ title:string, content: string }>()

    return <>
        <Head>
            <link rel="stylesheet" href={styleHref}>
        </Head>

        <h1>{data.title}</h1>
        <div dangerouslySetInnerHTML={{ __html:  data.content }} />
    </>
}
```

In this component :

- `PageProps` is the standard props object passed to page components (the top-level component of your page).
- `useData` is the hook used to access the data object. This hook can be used in any component with some caveats.
- `Head` is the component used to modify the document's `<head>`. We use it to link to the page stylesheet.

Now we need to modify the page module :

```ts filename=pages/posts.ts
...

import { getRenderFrom } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/runtime/preact.server.ts"
import { PostPage } from "./PostPage.tsx"

...

export const render = getRenderFrom(PostPage)
```

And that's it. We now have a static page that can be designed with jsx components. Remember that the homepage still uses js templates to output raw HTML. You can mix any UI framework you want if you don't mix them on the same page.

For now, Frugal still outputs static markup for our components. To have a client-side component, we'll have to use islands.

## First client-side island

We will add a counter to the homepage. To do so, we will migrate it to preact, like we did for the posts page (this is left as an exercise for you, dear reader).

First, we create our stateful counter component :

```tsx filename=Counter.tsx
import * as hooks from "preact/hooks";

export type CounterProps = {
    initialValue: number;
};

export function Counter({ initialValue }: CounterProps) {
    const [count, setCount] = hooks.useState(initialValue)

    return (
        <div>
            <button onClick={() => setCount(Math.max(0, count - 1))}>
                decrement
            </button>

            <span>{count}</span>

            <button onClick={() => setCount(count + 1)}>
                increment
            </button>
        </div>
    );
}
```

Next, we create a hydration script `Counter-hydrate.script.ts` :

```tsx
import { hydrate } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/runtime/preact.client.ts";
import { Counter } from "./Counter.tsx";

export const NAME = "Counter";

if (import.meta.main) {
    hydrate(NAME, () => Counter);
}
```

Since it is a client-side `script`, the `hydrate` function will execute only in the browser. The function will hydrate all instances of islands with the name `"Counter"` using the component `Counter` to do so. And now we create a `CounterIsland.tsx` component to create island instances of our `Counter` component :

```tsx
import { Island } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/runtime/preact.client.ts";

import { NAME } from "./Counter-hydrate.script.ts";
import { Counter, CounterProps } from "./Counter.tsx";

export function CounterIsland(props: CounterProps) {
    return <Island name={NAME} Component={Counter} props={props} />;
}
```

The `Island` component will render the `Counter` components in the static markup outputted by Frugal and embed any data necessary to the hydration process in that markup. The name of the island is also embedded in the markup.

We can now use our `CounterIsland` inside our `Page` component :

```tsx filename=pages/HomePage.tsx
import { PageProps, Head } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/runtime/preact.server.ts"
import "./post.css";
import { TITLE_ID } from  "hello.script.ts";
import { CounterIsland } from "./CounterIsland.tsx"

export const route = '/'

export function Page({ assets, descriptor }: PageProps) {
    const styleHref = assets["style"][descriptor]}
    const scriptSrc = assets["script"][descriptor]

    return <>
        <Head>
            <link rel="stylesheet" href={styleHref}>
            <script type="module" src={scriptSrc}></script>
        </Head>

        <h1 id={TITLE_ID}>My blog</h1>
        <CounterIsland initialValue={3}/>
    </>
}
```

Inside your browser's dev tools, you can see the generated js bundle containing our first _vanilla_ script and our component and its dependencies (`hydrate`, `preact` etc...).

## To infinity and beyond

The _getting-started_ section is done; you had a first overview of Frugal's capacities. Check out the references and guides to learn more about Frugal!
