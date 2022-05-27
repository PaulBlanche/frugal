import { config } from './frugal.config.ts';
import { FrugalBuilder } from './dep/frugal/core.ts';

const instance = await new FrugalBuilder(config).create();
await instance.build();
