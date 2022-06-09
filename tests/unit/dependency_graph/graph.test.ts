import * as asserts from '../../../dep/std/asserts.ts';
import * as graph from '../../../packages/dependency_graph/graph.ts';
import * as murmur from '../../../packages/murmur/mod.ts';

const myRoot: graph.Root = root({
    dependencies: [{
        url: new URL('file:///B'),
        dependencies: [{
            url: new URL('file:///A'),
        }, {
            url: new URL('file:///D'),
            dependencies: [{
                url: new URL('file:///C'),
            }, {
                url: new URL('file:///E'),
            }],
        }],
    }, {
        url: new URL('file:///G'),
        dependencies: [{
            url: new URL('file:///I'),
            dependencies: [{
                url: new URL('file:///H'),
            }],
        }],
    }],
});

Deno.test('pre order walk', () => {
    const visited: string[] = [];
    graph.preOrder(myRoot, (node) => {
        if (node.url !== undefined) {
            visited.push(node.url.toString());
        }
    });

    asserts.assertEquals(visited, [
        'file:///B',
        'file:///A',
        'file:///D',
        'file:///C',
        'file:///E',
        'file:///G',
        'file:///I',
        'file:///H',
    ]);
});

Deno.test('post order walk', () => {
    const visited: string[] = [];
    graph.inOrder(myRoot, (node) => {
        if (node.url !== undefined) {
            visited.push(node.url.toString());
        }
    });

    asserts.assertEquals(visited, [
        'file:///A',
        'file:///C',
        'file:///E',
        'file:///D',
        'file:///B',
        'file:///H',
        'file:///I',
        'file:///G',
    ]);
});

export function root(
    node: PartialRoot,
): graph.Root {
    const dependencies = (node.dependencies ?? []).map((dependency) => {
        return module(dependency);
    });

    return {
        type: 'root',
        id: 'root',
        hash: node.hash ?? '',
        dependencies,
    };
}

export function module(
    node: PartialModule,
): graph.Module {
    const dependencies = (node.dependencies ?? []).map((dependency) => {
        return module({ ...dependency, entrypoint: node.entrypoint });
    });

    const entrypoint = node.entrypoint ?? new URL('file:///');
    const url = node.url ?? new URL('file:///');

    return {
        type: 'module',
        id: `${entrypoint}:${url}`,
        entrypoint,
        url,
        moduleHash: dependencies.reduce(
            (hash, node) => hash.update(node.moduleHash),
            new murmur.Hash().update(node.contentHash ?? ''),
        ).digest(),
        contentHash: node.contentHash ?? '',
        dependencies,
    };
}

type PartialModule = Partial<
    Omit<graph.Module, 'dependencies'> & { dependencies: PartialModule[] }
>;
type PartialRoot = Partial<
    Omit<graph.Root, 'dependencies'> & { dependencies: PartialModule[] }
>;
