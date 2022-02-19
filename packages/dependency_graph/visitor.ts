export type VisitableNode = { type: string };

export type Visitor<NODE extends VisitableNode> =
    & {
        [K in `visit${NODE['type']}`]?: (node: NODE) => void;
    }
    & {
        all?: (node: NODE) => void;
    };

export function visit<NODE extends VisitableNode>(
    node: NODE,
    visitor: Visitor<NODE> = {},
) {
    const queue: NODE[] = [node];
    let current: NODE | undefined;
    while ((current = queue.pop()) !== undefined) {
        const children = visitNode(current, visitor);
        queue.push(...children.reverse());
    }
}

function visitNode<NODE extends VisitableNode>(
    node: NODE,
    visitor: Visitor<NODE>,
): NODE[] {
    const nodes = [];

    const method = `visit${node.type}`;
    if ((visitor as any)[method] !== undefined) {
        (visitor as any)[method](node);
    }
    if (visitor.all !== undefined) {
        visitor.all(node);
    }

    for (const key in node) {
        const value = node[key];
        if (isNode(value)) {
            nodes.push(value);
        }
        if (Array.isArray(value) && isNode(value[0])) {
            nodes.push(...value);
        }
    }

    return nodes;
}

function isNode(object: unknown): object is VisitableNode {
    return typeof object === 'object' && object !== null && 'type' in object &&
        typeof (object as any).type === 'string';
}
