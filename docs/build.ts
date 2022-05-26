import { config } from './frugal.config.ts';
import { Frugal } from './dep/frugal/core.ts';

const frugal = await new Frugal(config).build();
await frugal.build();
