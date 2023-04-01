import { Config } from '../../../Config.ts';
import { Session } from '../../Session.ts';
import { xor } from './xor.ts';

const CSRF_HEADER_NAME = 'X-CSRFToken';
const CSRF_FIELD_NAME = 'csrftoken';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS', 'TRACE'];

export class CsrfValidator {
  #config: Config;
  #session: Session;
  #mask?: string;

  constructor(config: Config, session: Session) {
    this.#config = config;
    this.#session = session;
    const mask = this.#session.store('token').get('csrfMask');
    this.#mask = typeof mask === 'string' ? mask : undefined;
  }

  async validate(request: Request) {
    try {
      // safe method don't need csrf
      if (SAFE_METHODS.includes(request.method)) {
        return true;
      }

      const isUrlProtected = this.#config.server.csrf?.isProtected?.(
        new URL(request.url),
      ) ?? false;

      if (!isUrlProtected) {
        return true;
      }

      const token = await this.#extract(request);
      if (token && this.#mask) {
        return this.#session.secret === xor(atob(token), this.#mask);
      }
      return false;
    } catch {
      return false;
    }
  }

  async #extract(request: Request) {
    try {
      const formData = await request.clone().formData();
      const value = formData.get(
        this.#config.server.csrf?.fieldName ?? CSRF_FIELD_NAME,
      );
      if (typeof value === 'string') {
        return value;
      }
    } catch {
      return request.headers.get(
        this.#config.server.csrf?.headerName ?? CSRF_HEADER_NAME,
      ) ?? undefined;
    }
  }
}
