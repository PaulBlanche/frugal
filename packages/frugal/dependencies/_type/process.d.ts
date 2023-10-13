import * as stream from "node:stream";
import * as streamWeb from "node:stream/web";

export type ChildProcessOptions = {
    env?: Record<string, string>;
};

export type ChildProcessStatus = {
    success: boolean;
    code?: number;
    signal?: NodeJS.Signals;
};

export type stdioStream = {
    streamReadable: stream.Readable;
    stream: streamWeb.ReadableStream<Uint8Array>;
    controller: ReadableStreamDefaultController<Uint8Array>;
};

export interface ChildProcess {
    readonly status: Promise<ChildProcessStatus>;
    readonly stderr: streamWeb.ReadableStream<Uint8Array>;
    readonly stdout: streamWeb.ReadableStream<Uint8Array>;
    readonly pid: number | undefined;
    kill(signal?: NodeJS.Signals): void;
    restart(): void;
}

export type Signal = "SIGINT" | "SIGTERM";
