/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as hooks from "preact/hooks";
import { count } from "./count.ts";

export type SharedCounterProps = {
    page: string;
};

export function SharedCounter({ page }: SharedCounterProps) {
    const [date, setDate] = hooks.useState(new Date(0));
    hooks.useEffect(() => {
        setDate(new Date());
    }, []);
    return (
        <>
            <div>Shared island (on {page})</div>
            <div>date: {date.toString()} (internal state, cleared on reload)</div>
            <div>count: {count} (shared signal)</div>
            <button onClick={() => count.value += 1}>increment</button>
        </>
    );
}
