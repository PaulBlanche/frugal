import { diff } from "./diff.ts";
import { patch } from "./patch.ts";

type RenderOptions = {
    onBeforeRender?: () => void;
    viewTransition?: boolean;
};

export async function render(nextDocument: Document, options: RenderOptions = {}) {
    if (document.startViewTransition && options.viewTransition) {
        const transition = document.startViewTransition(() => {
            return rawRender(nextDocument, options);
        });
        await transition.finished;
    } else {
        await rawRender(nextDocument, options);
    }
}

async function rawRender(nextDocument: Document, options: RenderOptions) {
    const assetPromises: Promise<void>[] = [];
    nextDocument.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach((styleLink) => {
        const styleRawHref = styleLink.getAttribute("href");
        const matchingStyleLink = document.querySelector(`link[rel="stylesheet"][href="${styleRawHref}"]`);
        if (!matchingStyleLink) {
            const cloneLink = styleLink.cloneNode();
            document.head.appendChild(cloneLink);
            assetPromises.push(
                new Promise<void>((res) => {
                    cloneLink.addEventListener("load", () => {
                        res();
                    });
                }),
            );
        }
    });

    const bodyPatch = diff(document.body, nextDocument.body);
    const headPatch = diff(document.head, nextDocument.head);

    await Promise.all(assetPromises);

    const clone = document.body.cloneNode(true);
    const bodyFragment = document.createDocumentFragment();
    bodyFragment.append(...clone.childNodes);
    patch(bodyPatch, bodyFragment);
    patch(headPatch, document.head);

    options.onBeforeRender?.();

    const updated = new Set();
    for (const attribute of nextDocument.body.attributes) {
        document.body.setAttribute(attribute.name, attribute.value);
        updated.add(attribute.name);
    }
    for (const attribute of document.body.attributes) {
        if (!updated.has(attribute.name)) {
            document.body.removeAttribute(attribute.name);
        }
    }
    document.body.replaceChildren(bodyFragment);

    // special case for buttons and anchors. If one was active before diffing, blur it after patching
    if (
        document.activeElement instanceof HTMLButtonElement ||
        document.activeElement instanceof HTMLAnchorElement
    ) {
        document.activeElement.blur();
    }
}
