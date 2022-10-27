import { serve } from '../dep/frugal/frugal_server.ts';

import { config } from '../frugal.config.ts';

await serve(config);
