import { FrugalConfig } from "../../../Config.ts";
import { Session } from "../../session/mod.ts";
import { xor } from "./xor.ts";

const CSRF_HEADER_NAME = "X-CSRFToken";
const CSRF_FIELD_NAME = "csrftoken";

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS", "TRACE"];

export class CsrfValidator {
    #config: FrugalConfig;
    #session: Session;
    #token?: string;

    constructor(session: Session, config: FrugalConfig) {
        this.#config = config;
        this.#session = session;
        this.#token = this.#session.get<string>("__frugal_csrftoken");
    }

    async validate(request: Request) {
        try {
            // safe method don't need csrf
            if (SAFE_METHODS.includes(request.method)) {
                return true;
            }

            const isUrlProtected = this.#config.server?.csrf?.isProtected?.(
                new URL(request.url),
            ) ?? false;

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

    async #extract(request: Request) {
        const token = await this.#extractFromBody(request) ?? this.#extractFromHeader(request);
        if (token === undefined) {
            return undefined;
        }

        const [mask, maskedToken] = token.split(":");
        return maskedToken === undefined ? mask : xor(mask, maskedToken);
    }

    async #extractFromBody(request: Request) {
        try {
            const formData = await request.clone().formData();
            const value = formData.get(
                this.#config.server?.csrf?.fieldName ?? CSRF_FIELD_NAME,
            );
            if (typeof value === "string") {
                return value;
            }
        } catch {
            return undefined;
        }
    }

    #extractFromHeader(request: Request) {
        return request.headers.get(
            this.#config.server?.csrf?.headerName ?? CSRF_HEADER_NAME,
        ) ?? undefined;
    }
}
