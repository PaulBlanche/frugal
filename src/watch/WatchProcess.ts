import * as streams from "../../dep/std/streams.ts";

import { FrugalConfig } from "../Config.ts";
import { log } from "../log.ts";

type EventType = "suspend" | "reload" | "ready";

export class WatchProcess {
    #config: FrugalConfig;
    #command: Deno.Command;
    #process?: Deno.ChildProcess;
    #listeners: ((type: EventType) => void)[];

    constructor(config: FrugalConfig) {
        this.#config = config;
        this.#listeners = [];
        this.#command = new Deno.Command(Deno.execPath(), {
            args: [
                "--unstable",
                "run",
                "-A",
                `--watch`,
                Deno.mainModule,
            ],
            env: {
                "FRUGAL_WATCH_PROCESS_CHILD": "1",
            },
            stdin: "piped",
            stdout: "piped",
            stderr: "piped",
        });
    }

    addEventListener(
        listener: (type: EventType) => void,
    ) {
        this.#listeners.push(listener);
    }

    spawn() {
        const frugal = new URL("../Frugal.ts", import.meta.url);
        const script = `
import { context } from "${frugal}";
import config from "${this.#config.self.href}";
await context(config).watch();
`;

        if (this.#process !== undefined) {
            log("watch process restarted", { scope: "WatchProcess" });

            this.#process.kill("SIGINT");
            this.#process = undefined;
        } else {
            log("watch process started", { scope: "WatchProcess" });
        }

        this.#process = this.#command.spawn();
        const writer = this.#process.stdin.getWriter();
        writer.write(new TextEncoder().encode(script));
        writer.close();
        const pid = this.#process.pid;
        this.#process.status.then(() => {
            if (this.#process?.pid === pid) {
                this.#process = undefined;
            }
        });
        this.#listenProcess(this.#process);
    }

    kill() {
        this.#process?.kill("SIGINT");
        this.#process = undefined;
    }

    async #listenProcess(process: Deno.ChildProcess) {
        const lines = streams.mergeReadableStreams(
            process.stdout,
            process.stderr,
        )
            .pipeThrough(new TextDecoderStream())
            .pipeThrough(new streams.TextLineStream());

        let firstEndBuild = true;
        for await (const line of lines) {
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

    #mainWatchScript() {
    }
}
