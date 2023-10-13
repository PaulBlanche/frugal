import { Cookie } from "../../../../dependencies/http.js";

export type CookieConfig = Omit<Cookie, "value" | "name"> & { name?: string };
