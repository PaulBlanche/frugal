import * as http from '../../../../dep/std/http.ts';

import { FrugalContext } from '../types.ts';
import { xor } from './xor.ts';

const CSRF_TOKEN_COOKIE_NAME = 'csrftoken';

export class CsrfToken {
    #context: FrugalContext;
    #token: string;

    constructor(context: FrugalContext) {
        this.#context = context;
        this.#token = this.#generateToken();
    }

    attach(response: Response) {
        http.setCookie(response.headers, {
            name: this.#context.config.csrf?.csrfTokenCookieName ??
                CSRF_TOKEN_COOKIE_NAME,
            value: this.#token,
            secure: true,
            sameSite: 'Lax',
            path: '/',
        });
    }

    get value() {
        return this.#token;
    }

    #generateToken(): string {
        const mask = crypto.randomUUID();
        this.#context.session.set('csrfMask', mask);
        return btoa(xor(this.#context.session.secret, mask));
    }
}
