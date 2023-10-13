import { build, context } from "frugal";

import config from "./frugal.config.js";

if (process.argv[2] === "build") {
    await build(config);
} else {
    await context(config).watch();
}
