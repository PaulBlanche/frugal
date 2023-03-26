import * as bytes from '../../dep/std/fmt/bytes.ts';

import { log } from '../log.ts';

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
    log?: 'warning' | 'error';
};

export class Budget {
    #speed: number;
    #delay: number;
    #budget: number;
    #shares: Record<AssetType, number>;
    #log: 'warning' | 'error';

    constructor(config: BudgetConfig = { speed: 20 * 1000 * 1000, delay: 1 }) {
        this.#speed = config.speed;
        this.#delay = config.delay;
        this.#budget = config.speed / 8 * config.delay;
        this.#shares = {
            ...DEFAULT_SHARES,
            ...config.assets,
        };
        this.#log = config.log ?? 'warning';
    }

    logBudget() {
        const detail = (Object.keys(this.#shares) as AssetType[]).map(
            (type) => {
                return `${type}: ${bytes.format(this.get(type))}`;
            },
        ).join('\n');

        log(
            `Web budget for a ${this.#delay}s load over ${
                bytes.format(this.#speed, { bits: true })
            }/s`,
            {
                scope: 'Budget',
                extra: detail,
            },
        );
    }

    get log() {
        return this.#log;
    }

    #total() {
        return Object.values(this.#shares).reduce(
            (acc, share) => acc + share,
            0,
        );
    }

    get(type: AssetType) {
        return this.#budget * this.#shares[type] / this.#total();
    }
}
