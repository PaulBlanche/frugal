import { config } from './frugal.config.ts';
import { watch } from './dep/frugal/frugal_oak.ts';

await watch(config, ['docs/data']);
