import { Island } from "$dep/frugal/runtime/preact.client.ts";

import { NAME } from "./CounterIsland.script.ts";
import { Counter, CounterProps } from "./Counter.tsx";

export function CounterIsland(props: CounterProps) {
    return <Island name={NAME} Component={Counter} props={props} />;
}
