import { diff } from './diff.ts';
import { patch } from './patch.ts';

export function render(nextDocument: Document) {
  patch(diff(document, nextDocument));

  // special case for buttons and anchors. If one was active before diffing, blur it after patching
  if (
    document.activeElement instanceof HTMLButtonElement ||
    document.activeElement instanceof HTMLAnchorElement
  ) {
    document.activeElement.blur();
  }

  /*[...document.body.childNodes].forEach((node) =>
        document.body.removeChild(node)
    );
    [...nextDocument.body.childNodes].forEach((node) =>
        document.body.appendChild(node)
    );*/
}
