import { NodeType } from './types.ts';

export function clone(node: Node) {
    if (isScriptElement(node)) {
        // for scripts cloning is not enough, we need to recreate the script
        // element for it to be loaded/evaluated again
        const script = document.createElement('script');
        for (const attribute of node.attributes) {
            script.setAttribute(attribute.name, attribute.value);
        }
        script.innerHTML = node.innerHTML;
        return script;
    }
    return node.cloneNode(true);
}

function isScriptElement(node: Node): node is HTMLScriptElement {
    return isElement(node) && node.nodeName === 'SCRIPT';
}

export function isElement(node: Node): node is Element {
    return node.nodeType === NodeType.ELEMENT_NODE;
}

export function hash(
    element: Element,
    attributeFilter?: string[],
): string {
    const key = [];

    if (attributeFilter) {
        for (const name of attributeFilter) {
            const value = element.getAttribute(name);
            if (value) {
                key.push(`${name}="${element.getAttribute(name)}"`);
            }
        }
    } else {
        for (const attribute of element.attributes) {
            key.push(`${attribute.name}="${attribute.value}"`);
        }
    }

    key.sort();

    return `${element.tagName} ${key.join(' ')} ${element.innerHTML}`;
}

type Attribute = [name: string, value: string | boolean];

const BOOLEAN_ATTRIBUTES = [
    'allowfullscreen',
    'async',
    'autofocus',
    'autoplay',
    'checked',
    'controls',
    'default',
    'defer',
    'disabled',
    'formnovalidate',
    'inert',
    'ismap',
    'itemscope',
    'loop',
    'multiple',
    'muted',
    'nomodule',
    'novalidate',
    'open',
    'playsinline',
    'readonly',
    'required',
    'reversed',
    'selected',
];

export function getAttributes(element: Element): Attribute[] {
    const attributes: Record<string, string | boolean> = {};

    for (const { name, value } of element.attributes) {
        attributes[name] = value;
    }

    for (const name of BOOLEAN_ATTRIBUTES) {
        attributes[name] = element.hasAttribute(name);
    }

    return Object.entries(attributes);
}
