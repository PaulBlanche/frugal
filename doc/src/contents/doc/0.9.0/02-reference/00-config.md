# Frugal config

Frugal expects a config object to be passed to the `build` or `context` methods :

```ts filename=frugal.config.js
import { Config } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"

export default {
    // ...
} satisfies Config;
```

## Top level options

### self

> **type:** `string`
>
> **required**

This parameter should contain the absolute path of the current module, using `import.meta.url` :

```ts
export default {
    ...
    self: import.meta.url;
    ...
}
```

> [!warn]
> You can use another value than `import.meta.url`, but Frugal might fail to resolve some paths.

### pages

> **type:** `string[]`
>
> **required**

This parameter contains the relative paths to the pages module of your project :

```ts
export default {
    ...
    pages: ["./pages/home.ts", "./pages/about.ts", "./pages/blog.ts"];
    ...
}
```

### outdir

> **type:** `string`
>
> **optional**
>
> **default value:** `"./dist/"`

This parameter sets the output directory that Frugal should target. Frugal will take full ownership of this directory (potentially deleting any files in it).

```ts
export default {
    ...
    outdir: './my-dist/';
    ...
}
```

### staticdir

> **type:** `string`
>
> **optional**
>
> **default value:** `"./static/"`

This parameter should contain the relative path of the directory containing static assets that Frugal should serve. Files in this directory are copied into the `/[outdir]/public` directory and served under `/`.

```ts
export default {
    ...
    static: './my-static/';
    ...
}
```

### importMap

> **type:** `string`
>
> **optional**

This parameter should contain the path to an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap). The import map would be where you would set the version for peer dependencies like preact.

```ts
export default {
    ...
    importMap: './import_map.json';
    ...
}
```

### globalCss

> **type:** `string`
>
> **optional**

This parameter should contain the relative path of a stylesheet that will be bundled and made accessible to all pages via `assets["style"]["global"]`.

```ts
export default {
    ...
    importMap: './global.css';
    ...
}
```

### esbuild

> **optional**

With this parameter, you can pass a subset of options to esbuild. See [esbuild doc](https://esbuild.github.io/api/) for more information.

```ts
export default {
    ...
    esbuild: {
        minify: true,
        splitting: true,
        jsx: "automatic",
        jsxImportSource: "preact",
    };
    ...
}
```

### plugins

> **type:** `Plugin[]`
>
> **optional**
>
> **default value:** `[]`

Frugal capabilities can be augmented with plugins passed via this parameter.

```ts
import { cssModule } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/plugins/cssModule.ts";
import { script } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/plugins/script.ts";

export default {
    ...
    plugins: [cssModule(), script()];
    ...
}
```

### exporter

> **type:** `Exporter`
>
> **optional**

Deploy to your favorite platform with exporters. This parameter allows you to export your project, such as a static site for Apache or a bundle ready for Deno Deploy.

```ts
import {  DenoExporter, UpstashCache } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts";

export default {
    ...
    exporter: new DenoExporter(
        new UpstashCache(
            Deno.env.get("UPSTASH_URL"), 
            Deno.env.get("UPSTASH_TOKEN")
        ),
    ),
    ...
}
```
