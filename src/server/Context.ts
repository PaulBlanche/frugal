import * as http from '../../dep/std/http.ts';

import { Config } from '../Config.ts';
import { log } from '../log.ts';
import { Router } from '../page/Router.ts';
import { Session } from './Session.ts';

export type Context = {
  request: Request;
  connInfo: http.ConnInfo;
  secure: boolean;
  state: Record<string, unknown>;
  config: Config;
  session?: Session;
  router: Router;
  log: typeof log;
};
