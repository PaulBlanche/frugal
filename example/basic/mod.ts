import { build, context } from "../../src/Frugal.ts";

import config from "./frugal.config.ts";

if (Deno.args[0] === "build") {
    await build(config);
} else {
    await context(config).watch();
}
