import { config } from './frugal.config.ts';
import { Frugal } from './dep/frugal/core.ts';

const frugal = await Frugal.build(config);
await frugal.build();
