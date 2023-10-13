import { build, context } from "http://0.0.0.0:8000/mod.ts";

import config from "./frugal.config.ts";

if (Deno.args[0] === "build") {
    await build(config);
} else {
    await context(config).watch();
}
