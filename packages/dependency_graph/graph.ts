export type Root = {
    type: 'root';
    url?: URL;
    hash: string;
    dependencies: Module[];
};

export type Module = {
    type: 'module';
    entrypoint: URL;
    url: URL;
    moduleHash: string;
    contentHash: string;
    dependencies: Module[];
};

export type Node = Root | Module;

/**
 * Pre-order walk of a graph. Each node will be visited only once.
 */
export function preOrder(node: Node, callback: (node: Node) => void) {
    const queue: { node: Node; path: string[] }[] = [{ node, path: [] }];
    let current: { node: Node; path: string[] } | undefined;
    while ((current = queue.pop()) !== undefined) {
        const currentPath = current.path;
        const currentNode = current.node;

        const currentNodeUrl = currentNode.url?.toString() ?? '';

        // detect cycles
        if (currentPath.includes(currentNodeUrl)) continue;

        currentNode.dependencies.slice().reverse().forEach((dependency) => {
            queue.push({
                node: dependency,
                path: [...currentPath, currentNodeUrl],
            });
        });

        callback(currentNode);
    }
}

/**
 * In-order walk of a graph. Each node will be visited only once.
 */
export function inOrder(node: Node, callback: (node: Node) => void) {
    const queue: { post?: boolean; node: Node; path: string[] }[] = [{
        node,
        path: [],
    }];
    let current: { post?: boolean; node: Node; path: string[] } | undefined;
    while ((current = queue.pop()) !== undefined) {
        const currentPath = current.path;
        const currentNode = current.node;

        const currentNodeUrl = currentNode.url?.toString() ?? '';

        if (current.post === true) {
            callback(currentNode);
            continue;
        }

        // detect cycles
        if (currentPath.includes(currentNodeUrl)) continue;

        current.post = true;
        queue.push(current);

        currentNode.dependencies.slice().reverse().forEach((dependency) => {
            queue.push({
                node: dependency,
                path: [...currentPath, currentNodeUrl],
            });
        });
    }
}
