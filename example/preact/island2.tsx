import * as hooks from "preact/hooks";
import { count } from "./count2.ts";

export function Island2() {
    const [state, setState] = hooks.useState("island ?");
    hooks.useEffect(() => {
        setState("island 2 !");
    });
    return (
        <>
            <div>{state}</div>
            <div>count: ${count}</div>
            <button onClick={() => count.value += 2}>increment</button>
        </>
    );
}
