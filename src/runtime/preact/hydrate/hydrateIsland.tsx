/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as preact from "preact";
import * as hooks from "preact/hooks";
import { createRootFragment } from "./createRootFragment.ts";

import { DataProvider } from "../dataContext.tsx";
import { HeadProvider } from "../Head.tsx";
import { App } from "../types.ts";
import { ISLAND_END } from "../Island.tsx";

export function hydrateIsland<PROPS>(
    start: HTMLScriptElement,
    App: App<PROPS>,
) {
    const props: preact.RenderableProps<PROPS> = start.textContent ? JSON.parse(start.textContent ?? {}) : {};

    const children = getComponentRange(start);

    // hydrate the "dom range" of the island
    preact.hydrate(
        <Hydratable App={App} props={props} />,
        createRootFragment(start.parentNode!, children),
    );

    start.dataset["hydrated"] = "";

    // we can't wait for the component to unmount (since it will happen
    // asynchronously after a state update), because we need the dom to be empty
    // for the next component before the `frugal:readystatechange` event for
    // completion (that triggers the hydration of the next islands).
    addEventListener("frugal:beforeunload", () => {
        getComponentRange(start).forEach((node) => node.parentNode?.removeChild(node));
    });
}

function getComponentRange(start: HTMLScriptElement) {
    // get the "dom range" of the island (scan nodes from start until)
    const children: Node[] = [];
    let node: ChildNode | null = start.nextSibling;
    while (node !== null) {
        if (isCommentNode(node)) {
            const match = node.data.match(ISLAND_END);
            if (match !== null) {
                break;
            }
        }
        children.push(node);
        node = node.nextSibling;
    }

    // we need at least one node in the range for hydration, so we create an
    // empty one
    if (children.length === 0) {
        const emptyNode = document.createElement("span");
        start.after(emptyNode);
        return [emptyNode];
    }

    return children;
}

function isCommentNode(node: Node): node is Comment {
    return node.nodeType === Node.COMMENT_NODE;
}

type HydratableProps<PROPS> = {
    App: App<PROPS>;
    props: preact.RenderableProps<PROPS>;
};

function Hydratable<PROPS>({ App, props }: HydratableProps<PROPS>) {
    const [unmounted, setUnmounted] = hooks.useState(false);

    // unmount the component on session unload. The DOM should already be
    // cleaned, but unmounting anyway allows running effect cleanups (like
    // removing event listeners, reseting signals...)
    hooks.useEffect(() => {
        addEventListener("frugal:beforeunload", () => {
            setUnmounted(true);
        });
    }, []);

    if (unmounted) {
        return <span></span>;
    }

    return (
        <DataProvider>
            <HeadProvider
                onHeadUpdate={(nextHead) => {
                    preact.render(
                        nextHead,
                        document.head,
                    );
                }}
            >
                <App {...props} />
            </HeadProvider>
        </DataProvider>
    );
}
