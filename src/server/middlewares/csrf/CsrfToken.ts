import * as http from '../../../../dep/std/http.ts';

import { Config } from '../../../Config.ts';
import { Session } from '../../Session.ts';
import { xor } from './xor.ts';

const CSRF_TOKEN_COOKIE_NAME = 'csrftoken';

export class CsrfToken {
  #session: Session;
  #config: Config;
  #token: string;

  constructor(session: Session, config: Config) {
    this.#session = session;
    this.#config = config;
    this.#token = this.#generateToken();
  }

  attach(response: Response) {
    http.setCookie(response.headers, {
      name: this.#config.server.csrf?.cookieName ??
        CSRF_TOKEN_COOKIE_NAME,
      value: this.#token,
      httpOnly: true,
      sameSite: 'Lax',
      path: '/',
    });
  }

  get value() {
    return this.#token;
  }

  #generateToken(): string {
    const mask = crypto.randomUUID();
    this.#session.store('token').set('csrfMask', mask);
    const token = btoa(xor(this.#session.secret, mask));
    return token;
  }
}
