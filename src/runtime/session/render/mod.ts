import { diff } from "./diff.ts";
import { patch } from "./patch.ts";

export async function render(nextDocument: Document, options: { onBeforeRender?: () => void } = {}) {
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

    await new Promise<void>((res) =>
        requestAnimationFrame(() => {
            document.body.replaceChildren(bodyFragment);
            res();
        })
    );

    // special case for buttons and anchors. If one was active before diffing, blur it after patching
    if (
        document.activeElement instanceof HTMLButtonElement ||
        document.activeElement instanceof HTMLAnchorElement
    ) {
        document.activeElement.blur();
    }
}
