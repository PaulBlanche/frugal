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

type AddConfig = {
    type: AssetType;
    assetPath: string;
    size: number;
};

type MetafileCheckConfig = {
    type: AssetType;
    metafile: esbuild.Metafile;
    outputPath: string;
};

export class Budget {
    #speed: number;
    #delay: number;
    #budget: number;
    #shares: Record<AssetType, number>;
    #log: "warning" | "error";
    #state: Record<AssetType, { total: number; assets: { path: string; size: number }[] }>;

    constructor(config: BudgetConfig = { speed: 20 * 1000 * 1000, delay: 1 }) {
        this.#speed = config.speed;
        this.#delay = config.delay;
        this.#budget = config.speed / 8 * config.delay;
        this.#shares = {
            ...DEFAULT_SHARES,
            ...config.assets,
        };
        this.#log = config.log ?? "warning";
        this.#state = {
            script: { total: 0, assets: [] },
            style: { total: 0, assets: [] },
            markup: { total: 0, assets: [] },
            images: { total: 0, assets: [] },
            fonts: { total: 0, assets: [] },
            video: { total: 0, assets: [] },
        };
    }

    reset() {
        this.#state = {
            script: { total: 0, assets: [] },
            style: { total: 0, assets: [] },
            markup: { total: 0, assets: [] },
            images: { total: 0, assets: [] },
            fonts: { total: 0, assets: [] },
            video: { total: 0, assets: [] },
        };
    }

    metafileAdd({ metafile, outputPath, type }: MetafileCheckConfig) {
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

        this.add({ size, type, assetPath: outputPath });
    }

    add({ type, assetPath, size }: AddConfig) {
        log(`Output ${type} asset "${assetPath}" (${bytes.format(size)})`, { scope: "Budget", level: "debug" });

        this.#state[type].total += size;
        this.#state[type].assets.push({ path: assetPath, size });
    }

    check() {
        for (const type of (Object.keys(this.#shares) as AssetType[])) {
            const limit = this.#limit(type);

            if (this.#state[type].total > limit) {
                const message = `Total ${type} assets size (${this.#state[type].total}) is over budget (${
                    bytes.format(limit)
                })`;

                const extra = this.#state[type].assets.map(({ path, size }) => `${path} (${bytes.format(size)})`).join(
                    "\n",
                );

                if (this.#log === "error") {
                    log(message, { scope: "Budget", extra, level: "error" });
                    throw new Error("Assets over budget");
                }

                log(message, { scope: "Budget", extra, level: "warning" });
            }
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
