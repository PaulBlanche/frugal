import * as http from "../../dep/std/http.ts";

export type ServeOptions = {
    signal?: AbortSignal;
    onListen?: (params: { hostname: string; port: number }) => void;
};

export interface Server {
    serve(config?: ServeOptions): Promise<void>;
    handler(secure?: boolean): http.Handler;
}
