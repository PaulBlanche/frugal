/* @jsxRuntime automatic */
/* @jsxImportSource solid-js */
import { createSignal, onMount } from "solid-js";
import { Title } from "@solidjs/meta";

const [getValue, setValue] = createSignal("foo");
export function App(props) {
    onMount(() => setValue("bar"));
    return (
        <div>
            <Title>toto</Title>
            {props.children} {getValue()}
        </div>
    );
}
