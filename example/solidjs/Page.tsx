/* @jsxRuntime automatic */
/* @jsxImportSource solid-js */
import { App } from "./test.jsx";

export function Page() {
    return (
        <App toto="foo">
            <p>A lot of static data that should not be in the client bundle</p>
            <span>coucou</span>
        </App>
    );
}
