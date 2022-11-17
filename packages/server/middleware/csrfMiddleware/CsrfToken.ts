import * as http from '../../../../dep/std/http.ts';

import { Context } from '../types.ts';
import { xor } from './xor.ts';

const CSRF_TOKEN_COOKIE_NAME = 'csrftoken';

export class CsrfToken {
    #context: Context;
    #token: string;

    constructor(context: Context) {
        this.#context = context;
        this.#token = this.#generateToken();
    }

    attach(response: Response) {
        http.setCookie(response.headers, {
            name: this.#context.config.csrf?.csrfTokenCookieName ??
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
        this.#context.session.set('csrfMask', mask);
        return btoa(xor(this.#context.session.secret, mask));
    }
}
