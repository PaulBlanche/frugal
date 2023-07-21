import * as hooks from "preact/hooks";
import { count } from "./count1.ts";

export function Island1() {
    const [state, setState] = hooks.useState("island ?");
    hooks.useEffect(() => {
        setState("island 1 !");
    });
    return (
        <>
            <div>{state}</div>
            <div>count: ${count}</div>
            <button onClick={() => count.value += 1}>increment</button>
        </>
    );
}
