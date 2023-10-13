export type ServeOptions = {
    signal?: AbortSignal;
    port?: number;
    hostname?: string;
    onListen?: (params: { hostname: string; port: number }) => void;
} & ({ cert?: undefined; key?: undefined } | { cert: string; key: string });

export type HandlerInfo = {
    hostname: string;
    port: number;
    identifier: string;
};

export type EventStreamResponse = Response & { close: () => void };

export type Handler = (
    request: Request,
    info: HandlerInfo,
) => Response | EventStreamResponse | Promise<Response | EventStreamResponse>;

export type SendOptions = {
    rootDir: string;
};

export type Cookie = {
    name: string;
    value: string;
    expires?: Date | number;
    maxAge?: number;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: "strict" | "lax" | "none";
};
