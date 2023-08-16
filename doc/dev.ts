import { context } from "$dep/frugal/mod.ts";
import * as dotenv from "$dep/std/dotenv.ts";

await dotenv.load({
    export: true,
    envPath: new URL("./.env", import.meta.url).pathname,
    examplePath: new URL("./.env.exemple", import.meta.url).pathname,
});

const { default: config } = await import("./frugal.config.ts");

await context(config).watch();
