import { config } from './frugal.config.ts';
import {
    FrugalServerBuilder,
    FrugalWatcherServer,
} from './dep/frugal/frugal_oak.ts';

await new FrugalWatcherServer(new FrugalServerBuilder(config)).watch([
    'docs/data',
]);
