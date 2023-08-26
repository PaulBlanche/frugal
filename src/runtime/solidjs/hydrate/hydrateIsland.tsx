/* @jsxRuntime automatic */
/* @jsxImportSource solid-js */
import { render } from "solid-js/web";

import { App } from "../types.ts";
import { ISLAND_END } from "../Island.tsx";
import { Hydratable } from "./Hydratable.tsx";

export function hydrateIsland<PROPS>(
    start: HTMLElement,
    App: App<PROPS>,
) {
    const props: preact.RenderableProps<PROPS> = start.textContent ? JSON.parse(start.textContent ?? {}) : {};

    const nodeRange = getComponentRange(start);

    const range = document.createRange();
    range.setStartBefore(nodeRange[0]);
    range.setEndAfter(nodeRange[nodeRange.length - 1]);

    const fragment = document.createDocumentFragment();

    render(() => <Hydratable App={App} props={props} />, fragment);

    range.deleteContents();
    range.insertNode(fragment);
}

function getComponentRange(start: HTMLElement) {
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
