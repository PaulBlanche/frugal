import * as streams from "../../dep/std/streams.ts";

import { FrugalConfig } from "../Config.ts";
import { log } from "../log.ts";

type EventType = "suspend" | "reload" | "ready";

export class WatchProcess {
    #config: FrugalConfig;
    #command: Deno.Command;
    #process?: Deno.ChildProcess;
    #listeners: ((type: EventType) => void)[];
    #processOutputLineStream?: ReadableStream<string>;

    constructor(config: FrugalConfig) {
        this.#config = config;
        this.#listeners = [];

        const command = Deno.execPath();
        const args = ["--unstable", "run", "-A", `--watch`, Deno.mainModule];
        log(`Setup watch process process`, {
            scope: "WatchProcess",
            level: "debug",
            extra: `${command} ${args.join(" ")}`,
        });
        this.#command = new Deno.Command(command, {
            args: args,
            env: {
                "FRUGAL_WATCH_PROCESS_CHILD": "1",
            },
            stdout: "piped",
            stderr: "piped",
        });
    }

    addEventListener(listener: (type: EventType) => void) {
        this.#listeners.push(listener);
    }

    spawn() {
        log(`watch process started`, { scope: "WatchProcess" });

        this.#process = this.#command.spawn();
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

    async #listenProcess(process: Deno.ChildProcess) {
        this.#processOutputLineStream = streams.mergeReadableStreams(
            process.stdout,
            process.stderr,
        )
            .pipeThrough(new TextDecoderStream())
            .pipeThrough(new streams.TextLineStream());

        let firstEndBuild = true;
        for await (const line of this.#processOutputLineStream) {
            const trimedLine = line.trim();
            if (trimedLine.length === 0) {
                continue;
            }

            try {
                const data = JSON.parse(trimedLine);
                switch (data.type) {
                    case "start-build": {
                        this.#listeners.forEach((listener) => listener("suspend"));
                        break;
                    }
                    case "end-build": {
                        if (firstEndBuild) {
                            this.#listeners.forEach((listener) => {
                                listener("ready");
                            });
                            firstEndBuild = false;
                        } else {
                            this.#listeners.forEach((listener) => {
                                listener("reload");
                            });
                        }
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
