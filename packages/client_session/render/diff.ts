import {
    AttributePatch,
    Diff,
    NodePatch,
    NodeType,
    PatchType,
    UpdateElementPatch,
} from './types.ts';
import { clone, getAttributes, hash } from './utils.ts';

type DiffQueueItem = [
    patchList: NodePatch[],
    actual?: Node | null,
    target?: Node | null,
];

function preserveNode(): NodePatch {
    return { type: PatchType.PRESERVE_NODE };
}
function removeNode(): NodePatch {
    return { type: PatchType.REMOVE_NODE };
}
function appendNode(target: Node): NodePatch {
    return {
        type: PatchType.APPEND_NODE,
        node: clone(target),
    };
}
function replaceNode(target: Node): NodePatch {
    return {
        type: PatchType.REPLACE_NODE,
        node: clone(target),
    };
}
function childNodes(node: Node) {
    return node.childNodes;
}

export function diff(actual: Document, target: Document): Diff {
    const patchList: NodePatch[] = [];
    const queue: DiffQueueItem[] = [[patchList, actual, target]];

    let current: DiffQueueItem | undefined;

    while ((current = queue.shift()) !== undefined) {
        const [patch, items] = visit(current[1], current[2]);
        if (patch !== undefined) {
            current[0].push(patch);
        }
        if (items !== undefined) {
            queue.push(...items);
        }
    }

    return {
        node: actual,
        patch: patchList[0],
    };
}

type VisitResult = [patch: NodePatch] | [
    patch: NodePatch,
    items: DiffQueueItem[],
];

function visit(actual?: Node | null, target?: Node | null): VisitResult {
    if (actual === undefined || actual === null) {
        if (target === undefined || target === null) {
            return [preserveNode()];
        } else {
            return [appendNode(target)];
        }
    }

    if (target === undefined || target === null) {
        return [removeNode()];
    }

    if (actual.nodeType !== target.nodeType) {
        return [replaceNode(target)];
    }

    switch (actual.nodeType) {
        case NodeType.TEXT_NODE: {
            return visitText(actual as Text, target as Text);
        }
        case NodeType.ELEMENT_NODE: {
            return visitElement(actual as Element, target as Element);
        }
        case NodeType.DOCUMENT_NODE: {
            return visit(
                (actual as Document).documentElement,
                (target as Document).documentElement,
            );
        }
    }

    return [replaceNode(target)];
}

function visitText(actual: Text, target: Text): VisitResult {
    // text nodes are guaranteed to have a value
    if (actual.nodeValue!.trim() === target.nodeValue!.trim()) {
        return [preserveNode()];
    } else {
        return [{
            type: PatchType.UPDATE_TEXT,
            text: target.nodeValue!,
        }];
    }
}

function visitElement(actual: Element, target: Element): VisitResult {
    if (actual.tagName !== target.tagName) {
        return [replaceNode(target)];
    }

    const patch: NodePatch = {
        type: PatchType.UPDATE_ELEMENT,
        children: [],
        attributes: computeAttributePatch(actual, target),
    };

    if (childNodes(actual).length === 0 && childNodes(target).length) {
        return [patch];
    }

    const items = actual.tagName !== 'HEAD'
        ? computeElementPatch(patch, actual, target)
        : computeHeadPatch(
            patch,
            actual as HTMLHeadElement,
            target as HTMLHeadElement,
        );

    return [patch, items];
}

function computeAttributePatch(
    actual: Element,
    target: Element,
): AttributePatch[] {
    const patches: AttributePatch[] = [];

    const removes = new Map<string, string | boolean>();
    const sets = new Map<string, string | boolean>();

    for (const [name, value] of getAttributes(actual)) {
        if (value !== false) {
            removes.set(name, value);
        }
    }

    for (const [name, value] of getAttributes(target)) {
        const actualAttributeValue = removes.get(name);
        if (actualAttributeValue === null) {
            // attribute only exists in target, set it
            sets.set(name, value);
        } else if (actualAttributeValue === value) {
            // attribute is the same in both, do not remove
            removes.delete(name);
        } else {
            // attribute is different in both do not remove if value is truthy
            // (different string value or boolean true), would be useless
            if (value) {
                removes.delete(name);
            }
            sets.set(name, value);
        }
    }

    for (const [name] of removes) {
        patches.push({ type: PatchType.REMOVE_ATTRIBUTE, name });
    }

    for (const [name, value] of sets) {
        if (value) {
            patches.push({ type: PatchType.SET_ATTRIBUTE, name, value });
        }
    }

    return patches;
}

function computeElementPatch(
    patch: UpdateElementPatch,
    actual: Element,
    target: Element,
): DiffQueueItem[] {
    const items: DiffQueueItem[] = [];
    const max = Math.max(
        childNodes(actual).length,
        childNodes(target).length,
    );

    for (let i = 0; i < max; i++) {
        items.push([
            patch.children,
            childNodes(actual)[i],
            childNodes(target)[i],
        ]);
    }

    return items;
}

function computeHeadPatch(
    patch: UpdateElementPatch,
    actual: HTMLHeadElement,
    target: HTMLHeadElement,
): DiffQueueItem[] {
    const removes = new Map<string, Element>();
    const inserts = new Map<string, Element>();
    const updates = new Map<string, Element>();

    for (const actualChild of actual.children) {
        removes.set(headChildHash(actualChild), actualChild);
    }

    for (const targetChild of target.children) {
        const headHash = headChildHash(targetChild);
        const actualChild = removes.get(headHash);
        if (actualChild !== undefined) {
            if (hash(actualChild) !== hash(targetChild)) {
                updates.set(headHash, targetChild);
            }
            removes.delete(headHash);
        } else {
            inserts.set(headHash, targetChild);
        }
    }

    const items: DiffQueueItem[] = [];

    for (const node of childNodes(actual)) {
        if (node.nodeType !== NodeType.ELEMENT_NODE) {
            patch.children.push(preserveNode());
            continue;
        }

        const element = node as Element;
        const key = headChildHash(element);

        // node must be removed
        if (removes.has(key)) {
            patch.children.push(removeNode());
            continue;
        }

        // then node must be updated
        const update = updates.get(key);
        if (update !== undefined) {
            const [elementPatch, elementItems] = visitElement(element, update);
            patch.children.push(elementPatch);
            elementItems && items.push(...elementItems);
            continue;
        }

        // then node must be preserved
        patch.children.push(preserveNode());
    }

    for (const node of inserts.values()) {
        patch.children.push(appendNode(node));
    }

    return items;
}

function headChildHash(element: Element) {
    switch (element.tagName) {
        case 'BASE':
        case 'TITLE':
            return hash(element, []);
        case 'META': {
            if (element.hasAttribute('name')) {
                return hash(element, ['name']);
            } else if (element.hasAttribute('property')) {
                return hash(element, ['property']);
            } else if (element.hasAttribute('http-equiv')) {
                return hash(element, ['http-equiv']);
            }
            return hash(element);
        }
        case 'LINK': {
            return hash(element, ['rel', 'href']);
        }
        default: {
            return hash(element);
        }
    }
}
