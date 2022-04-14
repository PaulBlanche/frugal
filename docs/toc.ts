export type Toc = {
    children: TocNode[];
};

export type TocNode = {
    name: string;
    slug: string;
    children?: TocNode[];
};

export type FlatTocNode = (TocNode & { parent?: TocNode });

export type FlatToc = FlatTocNode[];

export function flattenToc(toc: Toc): FlatToc {
    const nodes: FlatToc = [];
    const queue: FlatTocNode[] = [...toc.children];
    let current: TocNode | undefined;
    while ((current = queue.shift()) !== undefined) {
        nodes.push(current);
        if (current.children) {
            queue.push(
                ...current.children.map((node) => ({
                    ...node,
                    parent: current,
                })),
            );
        }
    }
    return nodes;
}

export function nodeHref(node: TocNode) {
    if (node.slug === undefined) {
        return '';
    }
    return `/docs${node.slug}`;
}

export function nodeMatchHref(node: TocNode, href: string) {
    if (node.slug === undefined) {
        return false;
    }
    const ownHref = nodeHref(node);
    if (ownHref === '/docs/introduction' && href === '/docs') {
        return true;
    }
    return href === ownHref;
}

export function nodeFullLabel(node: FlatTocNode) {
    if (node.parent === undefined) {
        return node.name;
    } else {
        return `${node.parent.name} : ${node.name}`;
    }
}
