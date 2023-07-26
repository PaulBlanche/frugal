import * as hooks from "preact/hooks";
import { count } from "./count2.ts";

export function Island2() {
    const [state, setState] = hooks.useState("island ?");
    hooks.useEffect(() => {
        setState("island 2 !");
    });
    const random = hooks.useRef(Math.random());
    return (
        <>
            <div>{state} {random.current}</div>
            <div>count: ${count}</div>
            <button onClick={() => count.value += 2}>increment</button>
        </>
    );
}
