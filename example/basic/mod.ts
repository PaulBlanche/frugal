import { build, context } from "../../src/Frugal.ts";

import config from "./frugal.config.ts";

await build(config);

//context(config).watch();
