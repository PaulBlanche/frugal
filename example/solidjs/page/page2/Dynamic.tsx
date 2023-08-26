/* @jsxRuntime automatic */
/* @jsxImportSource solid-js */
import { SharedCounter } from "../component/counter/SharedCounter.tsx";

export function Dynamic() {
    return (
        <>
            <p>The chunk for the island is only loaded when the island becomes visible.</p>
            <SharedCounter page="dynamic island" />
        </>
    );
}
