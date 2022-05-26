import { config } from './frugal.config.ts';
import {
    FrugalServerBuilder,
    FrugalWatcherServer,
} from './dep/frugal/frugal_oak.ts';

const server = await new FrugalWatcherServer(new FrugalServerBuilder(config))
    .create();
await server.listen();
