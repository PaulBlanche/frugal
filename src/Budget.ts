import * as esbuild from "../dep/esbuild.ts";
import * as bytes from "../dep/std/fmt/bytes.ts";

import { log } from "./log.ts";

const DEFAULT_SHARES = {
    script: 16,
    style: 3,
    markup: 2,
    images: 63,
    fonts: 5,
    video: 9,
};

type AssetType = keyof typeof DEFAULT_SHARES;

export type BudgetConfig = {
    speed: number;
    delay: number;
    assets?: Partial<Record<AssetType, number | undefined>>;
    log?: "warning" | "error";
};

type BudgetCheckConfig = {
    metafile: esbuild.Metafile;
    type: AssetType;
    outputPath: string;
    scope: string;
};

export class Budget {
    #speed: number;
    #delay: number;
    #budget: number;
    #shares: Record<AssetType, number>;
    #log: "warning" | "error";

    constructor(config: BudgetConfig = { speed: 20 * 1000 * 1000, delay: 1 }) {
        this.#speed = config.speed;
        this.#delay = config.delay;
        this.#budget = config.speed / 8 * config.delay;
        this.#shares = {
            ...DEFAULT_SHARES,
            ...config.assets,
        };
        this.#log = config.log ?? "warning";
    }

    check({ metafile, outputPath, type, scope }: BudgetCheckConfig) {
        const outputs = metafile.outputs;
        const queue = [outputPath];
        let current: string | undefined;
        let size = 0;
        while ((current = queue.pop()) !== undefined) {
            const output = outputs[current];
            size += output.bytes;
            for (const imported of output.imports) {
                if (!imported.external && imported.kind !== "dynamic-import") {
                    queue.push(imported.path);
                }
            }
        }

        const limit = this.#limit(type);

        const message = `Output bundle "${outputPath}" (${bytes.format(size)})`;

        if (size > limit) {
            const extra = `Bundle size is over budget (${bytes.format(limit)})`;

            if (this.#log === "error") {
                const error = new Error(extra);
                log(message, { scope, extra: String(error) });
                throw error;
            }

            log(message, { scope, extra, level: "warning" });
        } else {
            log(message, { scope, level: "debug" });
        }
    }

    logBudget() {
        const detail = (Object.keys(this.#shares) as AssetType[]).map(
            (type) => {
                return `${type}: ${bytes.format(this.#limit(type))}`;
            },
        ).join("\n");

        log(
            `Web budget for a ${this.#delay}s load over ${bytes.format(this.#speed, { bits: true })}/s`,
            {
                scope: "Budget",
                extra: detail,
            },
        );
    }

    #total() {
        return Object.values(this.#shares).reduce(
            (acc, share) => acc + share,
            0,
        );
    }

    #limit(type: AssetType) {
        return this.#budget * this.#shares[type] / this.#total();
    }
}
