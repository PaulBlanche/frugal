import { Handler, ServeOptions } from "../../../dependencies/http.js";

export interface Server {
    serve(config?: ServeOptions): Promise<void>;
    handler(secure?: boolean): Handler;
}
