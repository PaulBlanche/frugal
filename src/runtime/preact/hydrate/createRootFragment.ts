// from https://gist.github.com/developit/f4c67a2ede71dc2fab7f357f39cff28c
/**
 * A Preact 11+ implementation of the `replaceNode` parameter from Preact 10.
 *
 * This creates a "Persistent Fragment" (a fake DOM element) containing one or more
 * DOM nodes, which can then be passed as the `parent` argument to Preact's `render()` method.
 */
export function createRootFragment(
  parent: Node & { __k?: unknown },
  replaceNode: Node | Node[],
) {
  replaceNode = ([] as Node[]).concat(replaceNode);

  const s = replaceNode[replaceNode.length - 1].nextSibling;

  function insert(c: Node, r: Node) {
    if (r && r.parentNode === parent) {
      parent.insertBefore(c, r);
    } else if (s && s.parentNode === parent) {
      parent.insertBefore(c, s);
    }
  }

  return (parent.__k = {
    nodeType: 1,
    parentNode: parent,
    firstChild: replaceNode[0],
    childNodes: replaceNode,
    insertBefore: insert,
    appendChild: insert,
    removeChild: function (c: Node) {
      parent.removeChild(c);
    },
  }) as unknown as DocumentFragment;
}
