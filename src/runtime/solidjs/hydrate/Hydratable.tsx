/* @jsxRuntime automatic */
/* @jsxImportSource solid-js */
import * as solid from "solid-js";
import { App } from "../types.ts";
import { DataProvider } from "../dataContext.tsx";

type HydratableProps<PROPS> = {
    App: App<PROPS>;
    props: preact.RenderableProps<PROPS>;
};

export function Hydratable<PROPS>({ App, props }: HydratableProps<PROPS>) {
    const [unmounted, setUnmounted] = solid.createSignal(false);

    // unmount the component on session unload. The DOM should already be
    // cleaned, but unmounting anyway allows running effect cleanups (like
    // removing event listeners, reseting signals...)
    solid.onMount(() => {
        addEventListener("frugal:beforeunload", () => {
            setUnmounted(true);
        });
    });

    return (
        <solid.Show when={!unmounted()}>
            <DataProvider>
                <App {...props} />
            </DataProvider>
        </solid.Show>
    );
}
