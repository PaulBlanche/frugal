/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as preact from 'preact';
import { END_NO_DIFF_REGEXP, onReadyStateChange } from '../../client_session/mod.ts';
import { createRootFragment } from './createRootFragment.ts';

import { DataProvider } from '../dataContext.tsx';
import { HeadProvider } from '../Head.tsx';
import { App } from '../types.ts';

export function hydrateIsland<PROPS>(
    start: HTMLScriptElement,
    App: App<PROPS>,
) {
    const props: preact.RenderableProps<PROPS> = start.textContent
        ? JSON.parse(start.textContent ?? {})
        : {};

    // get the "dom range" of the island (scan nodes from start until)
    const children = [];
    let node: ChildNode | null = start.nextSibling;
    while (node !== null) {
        if (isCommentNode(node)) {
            const match = node.data.match(END_NO_DIFF_REGEXP);
            if (match !== null) {
                break;
            }
        }
        children.push(node);
        node = node.nextSibling;
    }

    // hydrate the "dom range" of the island
    preact.hydrate(
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
        </DataProvider>,
        createRootFragment(start.parentNode!, children),
    );
}

function isCommentNode(node: Node): node is Comment {
    return node.nodeType === Node.COMMENT_NODE;
}
