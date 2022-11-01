import { build } from '../dep/frugal/core.ts';

import { config } from '../frugal.config.ts';

try {
    await build(config);
} catch (e) {
    console.log(e);
    throw e;
}
