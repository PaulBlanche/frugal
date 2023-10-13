import * as _type from "../_type/process.js";

import * as colors from "../colors/deno.js";
import * as path from "../path/deno.js";

/** @param {number} [code] */
export function exit(code) {
    Deno.exit(code);
}

/**
 * @param {_type.Signal} signal
 * @param {() => void} handler
 */
export function addSignalListener(signal, handler) {
    Deno.addSignalListener(signal, handler);
}

export const env = {
    /**
     * @param {string} key
     * @returns {string | undefined}
     */
    get(key) {
        return Deno.env.get(key);
    },
};

export const args = Deno.args;

export const mainModule = path.fromFileURL(Deno.mainModule);

export function cwd() {
    return Deno.cwd();
}

export function execPath() {
    return Deno.execPath();
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
    /** @type {Deno.ChildProcess} */
    #process;
    /** @type {Deno.Command} */
    #command;

    /**
     * @param {string} command
     * @param {_type.ChildProcessOptions} options
     */
    constructor(command, options) {
        this.#command = new Deno.Command(execPath(), {
            ...options,
            args: ["run", "-A", command],
            stdout: "piped",
            stderr: "piped",
        });
        this.#process = this.#spawn();
    }

    get status() {
        return this.#process.status;
    }

    get stderr() {
        return this.#process.stderr;
    }

    get stdout() {
        return this.#process.stdout;
    }

    get pid() {
        return this.#process.pid;
    }

    #spawn() {
        console.log(`${colors.blue("Watcher")} Process started`);
        const process = this.#command.spawn();

        process.status.then((status) => {
            if (status.success) {
                console.log(
                    `${colors.blue("Watcher")} Process finished. Restarting on file change...`,
                );
            } else {
                console.log(
                    `${colors.blue("Watcher")} Process failed. Restarting on file change...`,
                );
            }
        });

        return process;
    }

    /** @param {NodeJS.Signals} [signal] */
    kill(signal) {
        this.#process.kill(signal);
    }

    restart() {
        // cleare terminal and move back to top
        Deno.stdout.write("\x1b[2J");
        Deno.stdout.write("\x1b[H");

        this.kill("SIGINT");
        this.#process = this.#spawn();
    }
}
