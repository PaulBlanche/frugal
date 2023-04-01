import { AttributePatch, Diff, NodePatch, PatchType } from './types.ts';
import { isElement } from './utils.ts';

type PatchQueueItem = {
  patch: NodePatch;
  parent: Node;
  child?: Node;
};

export function patch(diff: Diff) {
  const parent = diff.node.documentElement;
  if (parent === null || parent === undefined) {
    return;
  }

  const queue: PatchQueueItem[] = [];
  queue.push({
    patch: diff.patch,
    parent,
  });

  let current: PatchQueueItem | undefined;
  while ((current = queue.shift()) !== undefined) {
    const { items } = patchNode(
      current.patch,
      current.parent,
      current.child,
    );

    if (items) {
      queue.unshift(...items);
    }
  }
}

function patchNode(patch: NodePatch, parent: Node, child?: Node) {
  switch (patch.type) {
    case PatchType.PRESERVE_NODE: {
      return {};
    }
    case PatchType.APPEND_NODE: {
      parent.appendChild(patch.node);
      return {};
    }
    case PatchType.REMOVE_NODE: {
      if (!child) {
        return {};
      }

      parent.removeChild(child);
      return {};
    }
    case PatchType.UPDATE_TEXT: {
      if (!child) {
        return {};
      }

      child.nodeValue = patch.text;
      return {};
    }
    case PatchType.REPLACE_NODE: {
      if (!child) {
        return {};
      }

      parent.replaceChild(patch.node, child);
      return {};
    }
    case PatchType.UPDATE_ELEMENT: {
      const element = child ?? parent;
      if (element && isElement(element)) {
        patchAttribute(element, patch.attributes);
      }

      return {
        items: patch.children.map((childPatch, index) => ({
          patch: childPatch,
          parent: element,
          child: element.childNodes[index],
        })),
      };
    }
  }
}

function patchAttribute(element: Element, patches: AttributePatch[]) {
  for (const patch of patches) {
    switch (patch.type) {
      case PatchType.REMOVE_ATTRIBUTE: {
        // special case for checked, must update the element checked
        // state, because the attribute is only the initial value
        if (
          patch.name === 'checked' &&
          element instanceof HTMLInputElement
        ) {
          element.checked = false;
        }

        element.removeAttribute(patch.name);
        break;
      }

      case PatchType.SET_ATTRIBUTE: {
        // special case for checked, must update the element checked
        // state, because the attribute is only the initial value
        if (
          patch.name === 'checked' &&
          element instanceof HTMLInputElement
        ) {
          element.checked = true;
        }

        const value = patch.value;
        element.setAttribute(
          patch.name,
          typeof value === 'string' ? value : '',
        );
        break;
      }
    }
  }
}
