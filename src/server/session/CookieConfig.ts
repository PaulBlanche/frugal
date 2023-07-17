import * as http from "../../../dep/std/http.ts";

export type CookieConfig = Omit<Partial<http.Cookie>, "value">;
