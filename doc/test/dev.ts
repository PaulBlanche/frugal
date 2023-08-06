import { context } from "$dep/frugal/mod.ts";
import config from "./frugal.config.ts";

await context(config).watch();
