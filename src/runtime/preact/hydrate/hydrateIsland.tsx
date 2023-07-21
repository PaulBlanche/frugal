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

    // get the "dom range" of the island (scan nodes from start until)
    const children = [];
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

    // hydrate the "dom range" of the island
    preact.hydrate(
        <Hydratable App={App} props={props} />,
        createRootFragment(start.parentNode!, children),
    );

    start.dataset["hydrated"] = "";
}

function isCommentNode(node: Node): node is Comment {
    return node.nodeType === Node.COMMENT_NODE;
}

type HydratableProps<PROPS> = {
    App: App<PROPS>;
    props: preact.RenderableProps<PROPS>;
};

function Hydratable<PROPS>({ App, props }: HydratableProps<PROPS>) {
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
