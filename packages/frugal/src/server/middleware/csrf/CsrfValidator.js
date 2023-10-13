import { FrugalConfig } from "../../../Config.js";
import { Session } from "../../session/Session.js";
import { xor } from "./xor.js";

const CSRF_HEADER_NAME = "X-CSRFToken";
const CSRF_FIELD_NAME = "csrftoken";

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS", "TRACE"];

export class CsrfValidator {
    /** @type {FrugalConfig} */
    #config;
    /** @type {Session} */
    #session;
    /** @type {string | undefined} */
    #token;

    /**
     * @param {Session} session
     * @param {FrugalConfig} config
     */
    constructor(session, config) {
        this.#config = config;
        this.#session = session;
        this.#token = this.#session.get("__frugal_csrftoken");
    }

    /** @param {Request} request */
    async validate(request) {
        try {
            // safe method don't need csrf
            if (SAFE_METHODS.includes(request.method)) {
                return true;
            }

            const isUrlProtected =
                this.#config.server?.csrf?.isProtected?.(new URL(request.url)) ?? false;

            if (!isUrlProtected) {
                return true;
            }

            const token = await this.#extract(request);

            if (token !== undefined && this.#token !== undefined) {
                return this.#token === token;
            }

            return false;
        } catch {
            return false;
        }
    }

    /** @param {Request} request */
    async #extract(request) {
        const token = (await this.#extractFromBody(request)) ?? this.#extractFromHeader(request);
        if (token === undefined) {
            return undefined;
        }

        const [mask, maskedToken] = token.split(":");
        return maskedToken === undefined ? mask : xor(mask, maskedToken);
    }

    /** @param {Request} request */
    async #extractFromBody(request) {
        try {
            const formData = await request.clone().formData();
            const value = formData.get(this.#config.server?.csrf?.fieldName ?? CSRF_FIELD_NAME);
            if (typeof value === "string") {
                return value;
            }
        } catch {
            return undefined;
        }
    }

    /** @param {Request} request */
    #extractFromHeader(request) {
        return (
            request.headers.get(this.#config.server?.csrf?.headerName ?? CSRF_HEADER_NAME) ??
            undefined
        );
    }
}
