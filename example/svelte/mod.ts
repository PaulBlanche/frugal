import { context } from "../../mod.ts";
import config from "./frugal.config.ts";

await context(config).watch();
