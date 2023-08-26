/* @jsxRuntime automatic */
/* @jsxImportSource solid-js */
import { Island } from "../../../../../runtime/solidjs.client.ts";
import { NAME } from "./SharedCounterIsland.script.ts";
import { SharedCounter, SharedCounterProps } from "./SharedCounter.tsx";

export function SharedCounterIsland(props: SharedCounterProps) {
    return <Island name={NAME} Component={SharedCounter} props={props} />;
}
