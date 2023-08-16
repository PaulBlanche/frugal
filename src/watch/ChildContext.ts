import * as esbuild from "../../dep/esbuild.ts";
import { Builder } from "../build/Builder.ts";

export const WATCH_MESSAGE_SYMBOL = Symbol("WATCH_MESSAGE_SYMBOL");

export class ChildContext {
    #builder: Builder;
    #context?: esbuild.BuildContext;

    constructor(builder: Builder) {
        this.#builder = builder;
    }

    addEventListener() {}

    async watch() {
        const originalLog = console.log;
        console.log = (...args) => {
            if (
                typeof args[0] === "object" && args[0] !== null &&
                WATCH_MESSAGE_SYMBOL in args[0]
            ) {
                originalLog(JSON.stringify(args[0]));
            } else {
                originalLog(...args);
            }
        };

        // cleanup when killing the child process
        Deno.addSignalListener("SIGINT", async () => {
            await this.dispose();
            Deno.exit();
        });

        this.#context = await this.#builder.context();

        return await this.#context.watch();
    }

    async dispose() {
        if (this.#context) {
            await this.#context.dispose();
        }

        esbuild.stop();
    }
}
