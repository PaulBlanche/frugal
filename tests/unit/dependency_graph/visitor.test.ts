import * as asserts from '../../../dep/std/asserts.ts';
import { visit, Visitor } from '../../../packages/dependency_graph/visitor.ts';

type Node =
    & ({
        type: 'Children';
        children: Node[];
    } | {
        type: 'Dependency';
        dependency: Node[];
    } | {
        type: 'Reference';
        node: Node;
    } | {
        type: 'Leaf';
        foo: string;
    })
    & {
        id: number;
    };

Deno.test('visitor visists all nodes and call matching handler', () => {
    const tree: Node = {
        type: 'Children',
        id: 0,
        children: [{
            type: 'Children',
            id: 1,
            children: [{
                type: 'Leaf',
                id: 2,
                foo: 'foo',
            }, {
                type: 'Reference',
                id: 3,
                node: {
                    type: 'Dependency',
                    id: 4,
                    dependency: [],
                },
            }],
        }, {
            type: 'Dependency',
            id: 5,
            dependency: [{
                type: 'Leaf',
                id: 6,
                foo: 'foo',
            }, {
                type: 'Reference',
                id: 7,
                node: {
                    type: 'Leaf',
                    id: 8,
                    foo: 'foo',
                },
            }],
        }],
    };

    const children: number[] = [];
    const dependency: number[] = [];
    const reference: number[] = [];
    const leaf: number[] = [];
    const all: number[] = [];

    const visitor: Visitor<Node> = {
        visitChildren: (node) => {
            children.push(node.id);
        },
        visitDependency: (node) => {
            dependency.push(node.id);
        },
        visitReference: (node) => {
            reference.push(node.id);
        },
        visitLeaf: (node) => {
            leaf.push(node.id);
        },
        all: (node) => {
            all.push(node.id);
        },
    };

    visit(tree, visitor);

    asserts.assertEquals(children, [0, 1]);
    asserts.assertEquals(dependency, [4, 5]);
    asserts.assertEquals(reference, [3, 7]);
    asserts.assertEquals(leaf, [2, 6, 8]);
    asserts.assertEquals(all, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
});
