import { build } from "$dep/frugal/mod.ts";
import * as dotenv from "$dep/std/dotenv.ts";

if (!Deno.env.has("CI")) {
    await dotenv.load({
        export: true,
        envPath: new URL("./.env", import.meta.url).pathname,
        examplePath: new URL("./.env.exemple", import.meta.url).pathname,
    });
}

const { default: config } = await import("./frugal.config.ts");

await build(config);
