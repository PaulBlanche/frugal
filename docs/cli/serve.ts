import { serve } from '../dep/frugal/server.ts';

import { config } from '../frugal.config.ts';

await serve(config);
