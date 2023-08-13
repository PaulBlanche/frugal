# Exporters

Frugal is able to build and serve pages. But depending on your deployement plateform, you might want specific "deployables". Expoters are adpaters that produce deployable packages.

## Nginx

Export your project as a static website to be served with [NGINX](https://nginx.org/). In the future this exporter will also generate an NGINX config file.

To use this exporter, simply add it to your config file :

```ts filename=frugal.config.ts
import { NginxExporter } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts";

export default {
    ...
    exporter: new NginxExporter()
    ...
}
```

## Deno

Export your project to be run on Deno, or deployed on [Deno Deploy][https://deno.com/deploy].

### Configuration

You first have to chose a cache provider for static pages :

- `DenoKVCache` that will store static pages in [Deno KV](https://deno.com/deploy/docs/kv) (still in beta on Deno Deploy)
- `UpstashCache` that will store satic pages in [Upstash](https://upstash.com/)

Then, you'll have to add the Exporter to your config file :

```ts filename=frugal.config.ts
import { DenoExporter } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts";

export default {
    ...
    exporter:  new DenoExporter(
        new UpstashCache(Deno.env.get("UPSTASH_URL"), Deno.env.get("UPSTASH_TOKEN")),
    )
    ...
}
```

### Export result

You'll get a directory `deno/` in your [`outdir`](/doc@{{FRUGAL_VERSION}}/reference/configuration#heading-outdir) with an file `entrypoint.mjs`. This is the file that you should run to start the server.

In this directory there is also a directory `buildcache/` containing the initial content of the build cache and a script `populate.mjs` that will populate the static page cache with the content of `buildcache`.

> [!warn]
> On the first execution of `entrypoint.mjs` the `populate.mjs` script will be called before starting the server. The first boot time might be longer than subsequent boot time.
>
> This will happen only once, unless you cleared the static page cache's underlying data source (the Deno KV or Upstash Redis database).
