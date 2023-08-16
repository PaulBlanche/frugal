import * as hooks from "preact/hooks";
import { count } from "./count1.ts";

export function Island1() {
    const [state, setState] = hooks.useState("island ?");
    hooks.useEffect(() => {
        setState("island 1 !");
    });
    const random = hooks.useRef(Math.random());
    return (
        <>
            <div>{state} {random.current}</div>
            <div>count: ${count}</div>
            <button onClick={() => count.value += 1}>increment</button>
        </>
    );
}
