import { Context } from '../types.ts';
import { xor } from './xor.ts';

const CSRF_HEADER_NAME = 'X-CSRFToken';
const CSRF_FIELD_NAME = 'csrftoken';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS', 'TRACE'];

export class CsrfValidator {
    #context: Context;
    #mask?: string;

    constructor(context: Context) {
        this.#context = context;
        const mask = this.#context.session.get('csrfMask');
        this.#mask = typeof mask === 'string' ? mask : undefined;
    }

    async validate() {
        try {
            // safe method don't need csrf
            if (SAFE_METHODS.includes(this.#context.request.method)) {
                return true;
            }

            const isUrlProtected = this.#context.config.csrf?.isUrlProtected(
                new URL(this.#context.request.url),
            );

            if (!isUrlProtected) {
                return true;
            }

            const token = await this.#extract();
            console.log('validate csrfToken', { token, mask: this.#mask });
            if (token && this.#mask) {
                return this.#context.session.secret ===
                    xor(atob(token), this.#mask);
            }
            return false;
        } catch {
            return false;
        }
    }

    async #extract() {
        try {
            const formData = await this.#context.request.clone().formData();
            const value = formData.get(
                this.#context.config.csrf?.csrfFieldName ?? CSRF_FIELD_NAME,
            );
            if (typeof value === 'string') {
                return value;
            }
        } catch {
            return this.#context.request.headers.get(
                this.#context.config.csrf?.csrfHeaderName ?? CSRF_HEADER_NAME,
            ) ?? undefined;
        }
    }
}
