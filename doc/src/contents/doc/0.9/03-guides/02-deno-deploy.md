# Deno Deploy

## Configuration

Frugal can export your project for Deno Deploy. To do so you have to choose where the page cache will be stored :

- in [Deno KV](https://deno.com/deploy/docs/kv) (still in beta on Deno Deploy) with `DenoKVCache`
- in [Upstash](https://upstash.com/) with `UpstashCache`

have to configure an [`Exporter`](@@@) :

```ts filename=frugal.config.ts
import { DenoExporter, UpstashCache } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts";

export default {
    ...
    exporter:  new DenoExporter(
        new UpstashCache(Deno.env.get("UPSTASH_URL"), Deno.env.get("UPSTASH_TOKEN")),
    )
    ...
}
```

## Deployment

Before deployment we have
