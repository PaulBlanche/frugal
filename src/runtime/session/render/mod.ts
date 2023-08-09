import { diff } from "./diff.ts";
import { patch } from "./patch.ts";

export async function render(nextDocument: Document, options: { onBeforeRender?: () => void } = {}) {
    const bodyPatch = diff(document.body, nextDocument.body);
    const headPatch = diff(document.head, nextDocument.head);

    const assetPromises: Promise<void>[] = [];
    nextDocument.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]').forEach((element) => {
        document.head.appendChild(element);
        assetPromises.push(
            new Promise<void>((res) => {
                element.addEventListener("load", () => {
                    console.log("load", element.href);
                    res();
                });
            }),
        );
    });

    await Promise.all(assetPromises);

    options.onBeforeRender?.();

    const clone = document.body.cloneNode(true);
    const bodyFragment = document.createDocumentFragment();
    bodyFragment.append(...clone.childNodes);
    patch(bodyPatch, bodyFragment);
    patch(headPatch, document.head);

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
