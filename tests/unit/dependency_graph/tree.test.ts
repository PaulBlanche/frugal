import * as asserts from '../../../dep/std/asserts.ts';
import * as tree from '../../../packages/dependency_graph/tree.ts';
import * as murmur from '../../../packages/murmur/mod.ts';

const myRoot: tree.Root = root({
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
    tree.preOrder(myRoot, (node) => {
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
    tree.inOrder(myRoot, (node) => {
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
): tree.Root {
    const dependencies = (node.dependencies ?? []).map((dependency) => {
        return module(dependency);
    });

    return {
        type: 'root',
        hash: node.hash ?? '',
        dependencies,
    };
}

export function module(
    node: PartialModule,
): tree.Module {
    const dependencies = (node.dependencies ?? []).map((dependency) => {
        return module({ ...dependency, entrypoint: node.entrypoint });
    });

    return {
        type: 'module',
        entrypoint: node.entrypoint ?? new URL('file:///'),
        url: node.url ?? new URL('file:///'),
        moduleHash: dependencies.reduce(
            (hash, node) => hash.update(node.moduleHash),
            new murmur.Hash().update(node.contentHash ?? ''),
        ).digest(),
        contentHash: node.contentHash ?? '',
        dependencies,
    };
}

type PartialModule = Partial<
    Omit<tree.Module, 'dependencies'> & { dependencies: PartialModule[] }
>;
type PartialRoot = Partial<
    Omit<tree.Root, 'dependencies'> & { dependencies: PartialModule[] }
>;
