import { diff } from '../../../packages/client_session/render/diff.ts';
import { DOMParser } from '../../../dep/dom.ts';
import * as asserts from '../../../dep/std/testing/asserts.ts';
import { PatchType } from '../../../packages/client_session/render/types.ts';

const parser = new DOMParser();

Deno.test('diff: absolute minimal document', () => {
    const current = document('<html><head></head><body></body></html>');
    const target = document('<html><head></head><body></body></html>');

    const { patch, node } = diff(current, target);

    asserts.assertStrictEquals(current, node);
    asserts.assertEquals(patch, {
        type: PatchType.UPDATE_ELEMENT,
        children: [
            { type: PatchType.UPDATE_ELEMENT, children: [], attributes: [] },
            { type: PatchType.UPDATE_ELEMENT, children: [], attributes: [] },
        ],
        attributes: [],
    });
});

Deno.test('diff: document with attributes changes', () => {
    const current = document(
        '<html same="same" different="different" removed="removed" inert disabled><head></head><body></body></html>',
    );
    const target = document(
        '<html same="same" different="changed" readonly disabled><head></head><body></body></html>',
    );

    const { patch } = diff(current, target);

    asserts.assertEquals(patch, {
        type: PatchType.UPDATE_ELEMENT,
        children: [
            { type: PatchType.UPDATE_ELEMENT, children: [], attributes: [] },
            { type: PatchType.UPDATE_ELEMENT, children: [], attributes: [] },
        ],
        attributes: [
            { type: PatchType.REMOVE_ATTRIBUTE, name: 'removed' },
            { type: PatchType.REMOVE_ATTRIBUTE, name: 'inert' },
            {
                type: PatchType.SET_ATTRIBUTE,
                name: 'different',
                value: 'changed',
            },
            {
                type: PatchType.SET_ATTRIBUTE,
                name: 'readonly',
                value: true,
            },
        ],
    });
});

Deno.test('diff: document with text changes', () => {
    const current = document(
        '<html><head></head><body>foo</body></html>',
    );
    const target = document(
        '<html><head></head><body>bar</body></html>',
    );

    const { patch } = diff(current, target);

    asserts.assertEquals(patch, {
        type: PatchType.UPDATE_ELEMENT,
        children: [
            { type: PatchType.UPDATE_ELEMENT, children: [], attributes: [] },
            {
                type: PatchType.UPDATE_ELEMENT,
                children: [{
                    type: PatchType.UPDATE_TEXT,
                    text: 'bar',
                }],
                attributes: [],
            },
        ],
        attributes: [],
    });
});

Deno.test('diff: document with node tag change', () => {
    const current = document(
        '<html><head></head><body><div></div></body></html>',
    );
    const target = document(
        '<html><head></head><body><span>toto</span></body></html>',
    );

    const { patch } = diff(current, target);

    asserts.assertEquals(patch, {
        type: PatchType.UPDATE_ELEMENT,
        children: [
            { type: PatchType.UPDATE_ELEMENT, children: [], attributes: [] },
            {
                type: PatchType.UPDATE_ELEMENT,
                children: [{
                    type: PatchType.REPLACE_NODE,
                    node: target.querySelector('span')?.cloneNode(true) as Node,
                }],
                attributes: [],
            },
        ],
        attributes: [],
    });
});

Deno.test('diff: document with node deletion', () => {
    const current = document(
        '<html><head></head><body><div></div></body></html>',
    );
    const target = document(
        '<html><head></head><body></body></html>',
    );

    const { patch } = diff(current, target);

    asserts.assertEquals(patch, {
        type: PatchType.UPDATE_ELEMENT,
        children: [
            { type: PatchType.UPDATE_ELEMENT, children: [], attributes: [] },
            {
                type: PatchType.UPDATE_ELEMENT,
                children: [{ type: PatchType.REMOVE_NODE }],
                attributes: [],
            },
        ],
        attributes: [],
    });
});

Deno.test('diff: document with node insertion', () => {
    const current = document(
        '<html><head></head><body><div></div></body></html>',
    );
    const target = document(
        '<html><head></head><body><div></div><span></span></body></html>',
    );

    const { patch } = diff(current, target);

    asserts.assertEquals(patch, {
        type: PatchType.UPDATE_ELEMENT,
        children: [
            { type: PatchType.UPDATE_ELEMENT, children: [], attributes: [] },
            {
                type: PatchType.UPDATE_ELEMENT,
                children: [{
                    type: PatchType.UPDATE_ELEMENT,
                    children: [],
                    attributes: [],
                }, {
                    type: PatchType.APPEND_NODE,
                    node: target.querySelector('span')?.cloneNode(true) as Node,
                }],
                attributes: [],
            },
        ],
        attributes: [],
    });
});

Deno.test('diff: head handling', () => {
    const current = document(
        '<html><head><title>title</title><meta name="same" content="same" /><meta name="different" content="different" /><meta name="removed" content="removed" /></head></html>',
    );
    const target = document(
        '<html><head><meta name="same" content="same" /><meta name="different" content="updated" /><title>updated</title></head></html>',
    );

    const { patch } = diff(current, target);

    asserts.assertEquals(patch, {
        type: PatchType.UPDATE_ELEMENT,
        children: [
            {
                type: PatchType.UPDATE_ELEMENT,
                children: [
                    { type: PatchType.REMOVE_NODE },
                    { type: PatchType.PRESERVE_NODE },
                    {
                        type: PatchType.UPDATE_ELEMENT,
                        children: [],
                        attributes: [{
                            type: PatchType.SET_ATTRIBUTE,
                            name: 'content',
                            value: 'updated',
                        }],
                    },
                    { type: PatchType.REMOVE_NODE },
                    {
                        type: PatchType.APPEND_NODE,
                        node: target.querySelector('title')?.cloneNode(
                            true,
                        ) as Node,
                    },
                ],
                attributes: [],
            },
            { type: PatchType.UPDATE_ELEMENT, children: [], attributes: [] },
        ],
        attributes: [],
    });
});

function document(markup: string) {
    return parser.parseFromString(markup, 'text/html') as unknown as Document;
}
