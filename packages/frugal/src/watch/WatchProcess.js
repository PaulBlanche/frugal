import * as _type from "./_type/WatchProcess.js";
export * from "./_type/WatchProcess.js";

import * as _process from "../../dependencies/process.js";

import * as watcher from "./Watcher.js";
import { log } from "../log.js";
import * as deferred from "../utils/deferred.js";

export class WatchProcess {
    /** @type {watcher.Watcher} */
    #watcher;
    /** @type {_process.ChildProcess | undefined} */
    #process;
    /** @type {_type.Listener[]} */
    #listeners;
    /** @type {ReadableStream<string> | undefined} */
    #processOutputLineStream;

    constructor() {
        this.#listeners = [];

        log(`Setup watch process process`, {
            scope: "WatchProcess",
            level: "debug",
        });

        /** @type {Record<string, string>} */
        const env = {
            FRUGAL_WATCH_PROCESS_CHILD: "1",
        };

        const NO_COLOR = _process.env.get("NO_COLOR");
        if (NO_COLOR !== undefined) {
            env["NO_COLOR"] = NO_COLOR;
        }

        this.#watcher = new watcher.Watcher(_process.mainModule, {
            env,
        });
    }

    /** @param {_type.Listener} listener */
    addEventListener(listener) {
        this.#listeners.push(listener);
    }

    async spawn() {
        this.#process = await this.#watcher.spawn();
        const pid = this.#process.pid;
        this.#process.status.then(() => {
            if (this.#process?.pid === pid) {
                this.#process = undefined;
            }
        });
        this.#listenProcess(this.#process);
    }

    async kill() {
        this.#process?.kill("SIGINT");
        await this.#process?.status;
    }

    /** @param {_process.ChildProcess} process */
    async #listenProcess(process) {
        this.#processOutputLineStream = mergeReadableStreams(process.stdout, process.stderr)
            .pipeThrough(new TextDecoderStream())
            .pipeThrough(new TextLineStream());

        // double cast needed because ReadableStream is not async interable in ts types
        // (https://github.com/microsoft/TypeScript/issues/29867). This code is
        // server only, so it should be execute in nodjs, deno or bun, that have
        // async iterable ReadableStream
        const asyncIterableStream = /** @type {AsyncIterable<string>} */ (
            /** @type {unknown} */ (this.#processOutputLineStream)
        );

        for await (const line of asyncIterableStream) {
            const trimedLine = line.trim();
            if (trimedLine.length === 0) {
                continue;
            }

            try {
                const data = JSON.parse(trimedLine);
                switch (data.type) {
                    case "suspend": {
                        this.#listeners.forEach((listener) => listener("suspend"));
                        break;
                    }
                    case "reload": {
                        this.#listeners.forEach((listener) => listener("reload"));
                        break;
                    }
                    default:
                        console.log(line);
                }
            } catch {
                console.log(line);
            }
        }
    }
}

/** @extends {TransformStream<string, string>} */
export class TextLineStream extends TransformStream {
    #buf = "";

    constructor() {
        super({
            transform: (chunk, controller) => {
                this.#handle(chunk, controller);
            },
            flush: (controller) => {
                if (this.#buf.length > 0) {
                    controller.enqueue(this.#buf);
                }
            },
        });
    }

    /**
     * @param {string} chunk
     * @param {TransformStreamDefaultController<string>} controller
     */
    #handle(chunk, controller) {
        chunk = this.#buf + chunk;
        for (;;) {
            const lfIndex = chunk.indexOf("\n");
            if (lfIndex !== -1) {
                let crOrLfIndex = lfIndex;
                if (chunk[lfIndex - 1] === "\r") {
                    crOrLfIndex--;
                }
                controller.enqueue(chunk.slice(0, crOrLfIndex));
                chunk = chunk.slice(lfIndex + 1);
                continue;
            }
            break;
        }
        this.#buf = chunk;
    }
}

/**
 * @template T
 * @param {ReadableStream<T>[]} streams
 * @returns {ReadableStream<T>}
 */
function mergeReadableStreams(...streams) {
    const resolvePromises = streams.map(
        () => /** @type {deferred.Deferred<void>} */ (deferred.deferred()),
    );
    return new ReadableStream({
        start(controller) {
            let mustClose = false;
            Promise.all(resolvePromises)
                .then(() => {
                    controller.close();
                })
                .catch((error) => {
                    mustClose = true;
                    controller.error(error);
                });
            for (const [index, stream] of streams.entries()) {
                (async () => {
                    try {
                        // double cast needed because ReadableStream is not async interable in ts types
                        // (https://github.com/microsoft/TypeScript/issues/29867). This code is
                        // server only, so it should be execute in nodjs, deno or bun, that have
                        // async iterable ReadableStream
                        const asyncIterableStream = /** @type {AsyncIterable<T>} */ (
                            /** @type {unknown} */ (stream)
                        );

                        for await (const data of asyncIterableStream) {
                            if (mustClose) {
                                break;
                            }
                            controller.enqueue(data);
                        }
                        resolvePromises[index].resolve();
                    } catch (error) {
                        resolvePromises[index].reject(error);
                    }
                })();
            }
        },
    });
}
