import * as _type from "../_type/process.js";

import * as child_process from "node:child_process";
import * as stream from "node:stream";
import * as streamWeb from "node:stream/web";
import * as colors from "../colors/node.js";

/** @param {number} [code] */
export function exit(code) {
    process.exit(code);
}

/**
 * @param {_type.Signal} signal
 * @param {() => void} handler
 */
export function addSignalListener(signal, handler) {
    process.on(signal, handler);
}

export const env = {
    /**
     * @param {string} key
     * @returns {string | undefined}
     */
    get(key) {
        return process.env[key];
    },
};

export const args = process.argv.slice(2);

export const mainModule = process.argv[1];

export function cwd() {
    return process.cwd();
}

export function execPath() {
    return process.execPath;
}

/**
 * @param {string} command
 * @param {_type.ChildProcessOptions} options
 * @returns {_type.ChildProcess}
 */
export function spawn(command, options) {
    return new ChildProcess(command, options);
}

/** @implements {_type.ChildProcess} */
class ChildProcess {
    /** @type {{ command: string; options?: _type.ChildProcessOptions }} */
    #parameters;
    /** @type {child_process.ChildProcess} */
    #childProcess;
    /** @type {Promise<_type.ChildProcessStatus>} */
    #status;
    /** @type {boolean} */
    #exited;
    /** @type {_type.stdioStream} */
    #stderr;
    /** @type {_type.stdioStream} */
    #stdout;
    /** @type {boolean} */
    #logOnExit;

    /**
     * @param {string} command
     * @param {_type.ChildProcessOptions} [options]
     */
    constructor(command, options) {
        this.#parameters = { command, options };
        this.#logOnExit = true;
        console.log(`${colors.blue("Watcher")} Process started`);
        const { status, childProcess, exited } = this.#spawn();
        this.#childProcess = childProcess;
        this.#exited = exited;
        this.#status = status;

        this.#stderr = /** @type {_type.stdioStream} */ ({
            streamReadable: childProcess.stderr,
        });
        this.#stderr.stream = new streamWeb.ReadableStream({
            start: (controller) => {
                this.#stderr.controller = controller;
            },
            pull: () => {
                this.#stderr.streamReadable.resume();
            },
        });
        pipeStdio(this.#stderr);

        this.#stdout = /** @type {_type.stdioStream} */ ({
            streamReadable: childProcess.stdout,
        });
        this.#stdout.stream = new streamWeb.ReadableStream({
            start: (controller) => {
                this.#stdout.controller = controller;
            },
            pull: () => {
                this.#stdout.streamReadable.resume();
            },
        });
        pipeStdio(this.#stdout);
    }

    get status() {
        return this.#status;
    }

    get stderr() {
        return this.#stderr.stream;
    }

    get stdout() {
        return this.#stdout.stream;
    }

    get pid() {
        return this.#childProcess.pid;
    }

    #spawn() {
        const childProcess = child_process.spawn(execPath(), [this.#parameters.command], {
            env: this.#parameters.options?.env,
            stdio: "pipe",
        });

        this.#logOnExit = true;
        childProcess.on("exit", () => {
            if (this.#logOnExit) {
                console.log(
                    `${colors.blue("Watcher")} Process finished. Restarting on file change...`,
                );
            }
        });

        childProcess.on("error", () => {
            console.log(`${colors.blue("Watcher")} Process failed. Restarting on file change...`);
        });

        const status = new Promise((res, rej) => {
            childProcess.on("exit", (code, signal) => {
                this.#exited = true;
                res({
                    success: code === 0,
                    code: code ?? undefined,
                    signal: signal ?? undefined,
                });
            });
        });

        return { childProcess, status, exited: false };
    }

    /** @param {NodeJS.Signals} [signal] */
    kill(signal) {
        this.#kill(signal);
        this.#stdout.stream.cancel();
        this.#stderr.stream.cancel();
    }

    /** @param {NodeJS.Signals} [signal] */
    #kill(signal) {
        this.#logOnExit = false;
        this.#stderr.streamReadable.removeAllListeners();
        this.#stdout.streamReadable.removeAllListeners();

        if (!this.#exited) {
            this.#childProcess.kill(signal);
        }
    }

    restart() {
        this.#kill("SIGINT");

        setTimeout(() => {
            // cleare terminal and move back to top
            process.stdout.write("\x1b[2J");
            process.stdout.write("\x1b[H");

            console.log(`${colors.blue("Watcher")} File change detected. Restarting!`);
            const { status, childProcess, exited } = this.#spawn();

            //childProcess.stdout.on("data", (chunk) => console.log(chunk.toString()));

            this.#childProcess = childProcess;
            this.#exited = exited;
            this.#status = status;
            this.#stderr.streamReadable = /** @type {stream.Readable} */ (childProcess.stderr);
            this.#stdout.streamReadable = /** @type {stream.Readable} */ (childProcess.stdout);
            pipeStdio(this.#stdout);
        }, 100);
    }
}

/** @param {_type.stdioStream} stream */
function pipeStdio(stream) {
    stream.streamReadable.on("data", (chunk) => {
        stream.controller.enqueue(new Uint8Array(chunk));

        const desiredSize = stream.controller.desiredSize ?? 0;
        if (desiredSize <= 0) {
            stream.streamReadable.pause();
        }
    });

    stream.streamReadable.on("error", (error) => {
        stream.controller.error(error);
    });
}
