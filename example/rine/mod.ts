import * as frugal from "./dep/frugal.ts";

import config from "./frugal.config.ts";

//console.log(await exportKey());

await frugal.context(config).watch();
//await frugal.build(config);
