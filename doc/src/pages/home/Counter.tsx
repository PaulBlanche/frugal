import { computed, Signal, signal, useComputed } from "@preact/signals";

import counter from "./Counter.module.css";
import { clsx } from "$dep/clsx.ts";

export type CounterProps = {
    initialValue: number;
};

const globalCount = signal<number | undefined>(undefined);

export function Counter({ initialValue }: CounterProps) {
    const count = useComputed(() => globalCount.value ?? initialValue);

    return (
        <div class={clsx(counter["wrapper"])}>
            <h3 class={clsx(counter["title"])}>This is an interactive island</h3>
            <span class={clsx(counter["description"])}>
                It was hydrated on the client with an initial value of <strong>{initialValue}</strong>{" "}
                supplied by the server
            </span>

            <div class={clsx(counter["counter"])}>
                <button
                    class={clsx(counter["button"])}
                    disabled={count.value === 0}
                    onClick={() => globalCount.value = Math.max(0, count.value - 1)}
                >
                    decrement
                </button>

                <span class={clsx(counter["count"])}>{count}</span>

                <button class={clsx(counter["button"])} onClick={() => globalCount.value = count.value + 1}>
                    increment
                </button>
            </div>
        </div>
    );
}
