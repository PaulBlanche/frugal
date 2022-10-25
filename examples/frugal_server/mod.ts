import { build } from '../../packages/core/mod.ts';
import { serve } from '../../packages/frugal_server/mod.ts';
import { config } from './frugal.config.ts';

await build(config);
await serve(config)