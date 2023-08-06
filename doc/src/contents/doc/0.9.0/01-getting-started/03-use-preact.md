# Use Preact

## Update the configuration

First you'll need to an [Import Map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap)

```json filename=import_map.json
{
    "imports": {
        "preact": "https://esm.sh/preact@{{PREACT_VERSION}}",
        "preact/": "https://esm.sh/preact@{{PREACT_VERSION}}/",
        "@preact/signals": "https://esm.sh/@preact/signals@{{PREACT_SIGNAL_VERSION}}?external=preact",
        "preact-render-to-string": "https://esm.sh/preact-render-to-string@{{PREACT_RENDER_VERSION}}?external=preact"
    }
}
```

and a [`deno.json`](https://deno.land/manual@v1.35.3/getting_started/configuration_file) config file to configure `jsx` :

```json filename=deno.json
{
    "compilerOptions": {
        "jsxImportSource": "preact",
        "jsx": "react-jsx"
    },
    "importMap": "./import_map.json"
}
```

Now that deno is configured to understand `jsx` correctly, we need to configure update the `frugal.config.ts` file :

```ts filename=frugal.config.ts lines=[6-10]
import { Config } from "http://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"

export default {
    self: import.meta.url,
    pages: ['pages/home.ts'],
    importMap: "./import_map.json",
    esbuild: {
        jsx: "automatic",
        jsxImportSource: "preact",
    },
} satisfies Config;
```

Frugal uses (esbuild)[https://esbuild.github.io/] under the hood. The `esbuild` entry allows you to pass to esbuild somme options. Here we are configuring esbuild the same way we did deno, for it to understand `jsx` syntax correctly.

Since we use an Import Map, we also need to give it to Frugal (for it to resolve bare dependencies).
