import * as murmur from '../../murmur/mod.ts';

type Node = {
    name: string;
    attributes: { name: string; value: string }[];
    content: string;
    hash: string;
    element: Element;
};

export type Head = Node[];

export function serialize(head: HTMLHeadElement) {
    const snapshot: Head = [];

    head.childNodes.forEach((node) => {
        if (!(node instanceof Element)) {
            return;
        }

        const hash = new murmur.Hash();

        const name = node.nodeName.toLowerCase();
        const content = node.textContent ?? '';

        const sorted: string[] = [];
        const attributes: { name: string; value: string }[] = [];
        for (let i = 0, length = node.attributes.length; i < length; i++) {
            const attribute = node.attributes[i];
            attributes.push({
                name: attribute.name,
                value: attribute.value,
            });
            sorted.push(`${attribute.name}="${attribute.value}"`);
        }

        hash.update(name);

        sorted.sort();
        sorted.forEach((value) => {
            hash.update(value);
        });

        hash.update(content);

        snapshot.push({
            name,
            attributes,
            content,
            hash: hash.alphabetic(),
            element: node,
        });
    });

    return snapshot;
}
