# Dotenv

Usually, environment variables are defined in your CI and your deployment platform. But locally, you have to load them yourself. It's easy to do when [running Frugal](/doc@{{version}}/reference/running-frugal)

## Development mode

```ts filename=dev.ts
import { context } from "https://deno.land/x/frugal@0.9.2/mod.ts"
import { load } from "https://deno.land/std/dotenv/mod.ts";

await load();

const { default: config } = await import("./frugal.config.ts")

await context(config).watch()
```

We load the environment variable using the `dotenv`` module in the standard library,.

Since environment variables are usually used in the configuration, you must dynamically import the config _after_ loading the environment variable.

## Production mode

The same modification can be done in your `build.ts` script. But be careful, you might end up overwriting CI environment variables with your `.env` in production.

To be safe, never commit the `.env` file. That way, even if the load runs in production, there will be no `.env` file to load from.

You can also use the `CI` environment variable that is usually set by CI platforms:

```ts filename=build.ts
import { build } from "https://deno.land/x/frugal@0.9.2/mod.ts"
import { load } from "https://deno.land/std/dotenv/mod.ts";

if (!Deno.env.has("CI")) {
    await load()
}

const { default: config } = await import("./frugal.config.ts");

await build(config);
```
