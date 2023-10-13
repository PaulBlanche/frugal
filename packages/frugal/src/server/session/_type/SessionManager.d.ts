import { CookieConfig } from "./CookieConfig.js";
import { SessionStorage } from "./SessionStorage.js";

export type SessionManagerConfig = {
    storage: SessionStorage;
    cookie?: CookieConfig;
};
