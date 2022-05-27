import { config } from './frugal.config.ts';
import { FrugalServerBuilder } from './dep/frugal/frugal_oak.ts';

const server = await new FrugalServerBuilder(config).load();
await server.listen();
