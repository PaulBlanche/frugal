/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as preact from 'preact';
import { onReadyStateChange } from '../client_session/mod.ts';

import { DataProvider } from './dataContext.tsx';
import type { HydrationStrategy } from './types.ts';

export type App<PROPS> = (props: PROPS) => preact.VNode;

export type GetApp<PROPS> = () => Promise<App<PROPS>> | App<PROPS>;

export function hydrate<PROPS>(name: string, getApp: GetApp<PROPS>) {
    onReadyStateChange('complete', () => {
        const hydratableOnLoad = queryHydratables(name, 'load');
        if (hydratableOnLoad.length !== 0) {
            hydrateOnLoad(hydratableOnLoad, getApp);
        }

        const hydratableOnVisible = queryHydratables(name, 'visible');
        if (hydratableOnVisible.length !== 0) {
            hydrateOnVisible(hydratableOnVisible, getApp);
        }

        const hydratableOnIdle = queryHydratables(name, 'idle');
        if (hydratableOnIdle.length !== 0) {
            hydrateOnIdle(hydratableOnIdle, getApp);
        }

        const hydratableOnMediaQuery = queryHydratables(name, 'media-query');
        if (hydratableOnMediaQuery.length !== 0) {
            hydrateOnMediaQuery(hydratableOnMediaQuery, getApp);
        }
    });
}

function hydrateOnLoad<PROPS>(
    hydratables: NodeListOf<HTMLScriptElement>,
    getApp: GetApp<PROPS>,
) {
    Array.from(hydratables).map(async (script) => {
        hydrateElement(script, await getApp());
    });
}

function hydrateOnIdle<PROPS>(
    hydratables: NodeListOf<HTMLScriptElement>,
    getApp: GetApp<PROPS>,
) {
    setTimeout(() => {
        Array.from(hydratables).map(async (script) => {
            hydrateElement(script, await getApp());
        });
    }, 10);
}

function hydrateOnVisible<PROPS>(
    hydratables: NodeListOf<HTMLScriptElement>,
    getApp: GetApp<PROPS>,
) {
    const observer = new IntersectionObserver((entries, observer) => {
        entries.map(async (entry) => {
            if (
                entry.isIntersecting &&
                entry.target instanceof HTMLScriptElement
            ) {
                hydrateElement(entry.target, await getApp());
                observer.unobserve(entry.target);
            }
        });
    });

    hydratables.forEach((script) => {
        observer.observe(script);
    });
}

function hydrateOnMediaQuery<PROPS>(
    hydratables: NodeListOf<HTMLScriptElement>,
    getApp: GetApp<PROPS>,
) {
    Array.from(hydratables).map(async (root) => {
        const query = root.dataset['hydrationQuery'];
        if (query && matchMedia(query)) {
            hydrateElement(root, await getApp());
        }
    });
}

export function queryHydratables(
    name: string,
    strategy: HydrationStrategy,
): NodeListOf<HTMLScriptElement> {
    return document.querySelectorAll(
        `script[data-hydratable="${name}"][data-hydration-strategy="${strategy}"]`,
    );
}

export function hydrateElement<PROPS>(
    start: HTMLScriptElement,
    App: App<PROPS>,
) {
    const props: preact.RenderableProps<PROPS> = start.textContent
        ? JSON.parse(start.textContent ?? {})
        : {};

    let node: ChildNode | null = start.nextSibling;
    const children = [];
    while (node !== null) {
        children.push(node);
        if (isCommentNode(node)) {
            const match = node.data.match(/<!--end-furgal-island-->/);
            if (match !== null) {
                break;
            }
        }
        node = node.nextSibling;
    }

    console.log(children);

    preact.render(
        <DataProvider>
            <App {...props} />
        </DataProvider>,
        createRootFragment(
            start.parentNode! as HTMLElement,
            children,
        ) as unknown as DocumentFragment,
    );
}

function isCommentNode(node: Node): node is Comment {
    return node.nodeType === Node.COMMENT_NODE;
}

// from https://gist.github.com/developit/f4c67a2ede71dc2fab7f357f39cff28c
/**
 * A Preact 11+ implementation of the `replaceNode` parameter from Preact 10.
 *
 * This creates a "Persistent Fragment" (a fake DOM element) containing one or more
 * DOM nodes, which can then be passed as the `parent` argument to Preact's `render()` method.
 */
export function createRootFragment(
    parent: Element & { __k?: unknown },
    replaceNode: Node | Node[],
) {
    replaceNode = ([] as Node[]).concat(replaceNode);
    const s = replaceNode[replaceNode.length - 1].nextSibling;
    function insert(c: Node, r: Node) {
        parent.insertBefore(c, r || s);
    }

    return parent.__k = {
        nodeType: 1,
        parentNode: parent,
        firstChild: replaceNode[0],
        childNodes: replaceNode,
        insertBefore: insert,
        appendChild: insert,
        removeChild: function (c: Node) {
            parent.removeChild(c);
        },
    };
}
