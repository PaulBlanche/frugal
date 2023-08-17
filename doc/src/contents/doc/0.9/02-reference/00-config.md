# Frugal config

Frugal expects a config object to be passed to the `build` or `context` methods :

```ts filename=frugal.config.js
import { Config } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"

export default {
    // ...
} satisfies Config;
```

## Top-level options

### self

> **type:** `string`
>
> **required**

This parameter should contain the absolute path of the current module using `import.meta.url` :

```ts
export default {
    ...
    self: import.meta.url;
    ...
}
```

> [!warn]
> You have to give this specific value because Frugal can't infer it for you. You can use another value than `import.meta.url` if you know what you are doing, but Frugal might fail to resolve some paths.

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

This parameter should contain the path to an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap). The import map is where you would set the version of peer dependencies.

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

> **type:** `esbuild.BuildOptions`
>
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

Plugins can extend Frugal capabilities via this parameter. See the [Plugin](/doc@{{version}}/reference/plugins) section for more information.

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

Deploy to your favorite platform with [Exporters](/doc@{{version}}/reference/exporters). This parameter allows you to export your project, for example as a static site for Apache or Nginx or a bundle ready for Deno Deploy.

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

## Server options

### secure

> **type:** `boolean`
>
> **optional**
>
> **default value:** `false`

Set this boolean to true if the server is accessible over HTTPS.

### port

> **type:** `number`
>
> **optional**
>
> **default value:** `8000`

Set the port the server listens on.

### cryptoKey

> **type:** `CryptoKey`
>
> **optional**

Set a key that will be used for any functionality that needs HMAC. Frugal exposes two function `exportKey` and `importKey` to help you create the kind of key needed :

- The function `exportKey` will generate a new key and encode it in base64.
- The function `importKey` will take the base64 generated and decode the generated key.

```ts
import { importKey } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts";

export default {
    ...
    cryptoKey: await importKey("base64-of-your-key-you-got-from-exportKey")
    ...
}
```

> [!warn]
> Do not write the base64 version of your key directly in your config. Always use secrets and environment variables to avoid leaking it.

### session

> **type:** `{ cookie?: CookieConfig, storage: SessionStorage }`
>
> **optional**

If you want Frugal to handle [server sessions](/doc@{{version}}/reference/server#heading-session), you'll have to configure them here. The `cookie` value allows you to customize the cookie used to store the session id. The `storage` value defines how and where Frugal should store session data.

```ts
import { CookieSessionStorage } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts";

export default {
    ...
    session: {
        cookie: {
            name: 'MY-SESSION-ID-COOKIE',
            httpOnly: true,
            maxAge: 60,
        },
        storage: new CookieSessionStorage({
            name: 'MY-SESSION-STORAGE-COOKIE',
            httpOnly: true,
            maxAge: 60,
        })
    }
    ...
}
```

### csrf

> **type:** `{ cookieName?: string, fieldName?: string, headerName?: string, isProtected: (url: URL) => boolean }`
>
> **optional**

Configuration object for CSRF protection. The `ìsProtected` function lets you define whether an URL should be CSRF protected. The `fieldName` and `headerName` will customize the name of the form field or header where Frugal should find the CSRF token. The `cookieName` parameter lets you customize the cookie's name containing the CSRF token.

### middlewares

> **type:** `Middleware<Context>[]`
>
> **optional**
>
> **default value:** `[]`

Add some [middleware](/doc@{{version}}/reference/server#heading-middlewares) to the server stack.
