/* @jsxRuntime automatic */
/* @jsxImportSource solid-js */
import * as solid from "solid-js";
import { count, setCount } from "./count.ts";

export type SharedCounterProps = {
    page: string;
};

export function SharedCounter({ page }: SharedCounterProps) {
    const [date, setDate] = solid.createSignal(new Date(0));

    solid.onMount(() => {
        setDate(new Date());
    });

    return (
        <>
            <div>Shared island (on {page})</div>
            <div>date: {date().toString()} (internal state, cleared on reload)</div>
            <div>count: {count()} (shared signal)</div>
            <button onClick={() => setCount((count) => count + 1)}>increment</button>
        </>
    );
}
