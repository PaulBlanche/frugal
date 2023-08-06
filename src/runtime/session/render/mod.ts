import { diff } from "./diff.ts";
import { patch } from "./patch.ts";

export async function render(nextDocument: Document) {
    await patch(diff(document, nextDocument));

    // special case for buttons and anchors. If one was active before diffing, blur it after patching
    if (
        document.activeElement instanceof HTMLButtonElement ||
        document.activeElement instanceof HTMLAnchorElement
    ) {
        document.activeElement.blur();
    }
}
