import { diff } from "../../../../src/runtime/session/render/diff.ts";
import { DOMParser } from "../../../../dep/deno_dom.ts";
import * as asserts from "../../../../dep/std/testing/asserts.ts";
import { PatchType } from "../../../../src/runtime/session/render/types.ts";

const parser = new DOMParser();

Deno.test("diff: absolute minimal document", () => {
    const current = document("<html><head></head><body></body></html>");
    const target = document("<html><head></head><body></body></html>");

    const patch = diff(current, target);

    asserts.assertEquals(patch, {
        type: PatchType.UPDATE_ELEMENT,
        children: [
            { type: PatchType.UPDATE_ELEMENT, children: [], attributes: [] },
            { type: PatchType.UPDATE_ELEMENT, children: [], attributes: [] },
        ],
        attributes: [],
    });
});

Deno.test("diff: document with attributes changes", () => {
    const current = document(
        '<html same="same" different="different" removed="removed" inert disabled><head></head><body></body></html>',
    );
    const target = document(
        '<html same="same" different="changed" added="added" readonly disabled><head></head><body></body></html>',
    );

    const patch = diff(current, target);

    asserts.assertEquals(patch, {
        type: PatchType.UPDATE_ELEMENT,
        children: [
            { type: PatchType.UPDATE_ELEMENT, children: [], attributes: [] },
            { type: PatchType.UPDATE_ELEMENT, children: [], attributes: [] },
        ],
        attributes: [
            { type: PatchType.REMOVE_ATTRIBUTE, name: "removed" },
            { type: PatchType.REMOVE_ATTRIBUTE, name: "inert" },
            {
                type: PatchType.SET_ATTRIBUTE,
                name: "different",
                value: "changed",
            },
            {
                type: PatchType.SET_ATTRIBUTE,
                name: "added",
                value: "added",
            },
            {
                type: PatchType.SET_ATTRIBUTE,
                name: "readonly",
                value: true,
            },
        ],
    });
});

Deno.test("diff: document with node type changes", () => {
    const current = document(
        "<html><head></head><body>foo</body></html>",
    );
    const target = document(
        "<html><head></head><body><div></div></body></html>",
    );

    const patch = diff(current, target);

    asserts.assertEquals(patch, {
        type: PatchType.UPDATE_ELEMENT,
        children: [
            { type: PatchType.UPDATE_ELEMENT, children: [], attributes: [] },
            {
                type: PatchType.UPDATE_ELEMENT,
                children: [{
                    type: PatchType.REPLACE_NODE,
                    node: target.querySelector("div")?.cloneNode(true) as Node,
                }],
                attributes: [],
            },
        ],
        attributes: [],
    });
});

Deno.test("diff: document with text changes", () => {
    const current = document(
        "<html><head></head><body>foo</body></html>",
    );
    const target = document(
        "<html><head></head><body>bar</body></html>",
    );

    const patch = diff(current, target);

    asserts.assertEquals(patch, {
        type: PatchType.UPDATE_ELEMENT,
        children: [
            { type: PatchType.UPDATE_ELEMENT, children: [], attributes: [] },
            {
                type: PatchType.UPDATE_ELEMENT,
                children: [{
                    type: PatchType.UPDATE_TEXT,
                    text: "bar",
                }],
                attributes: [],
            },
        ],
        attributes: [],
    });
});

Deno.test("diff: document with text changes only in start/end withespaces", () => {
    const current = document(
        "<html><head></head><body>foo</body></html>",
    );
    const target = document(
        "<html><head></head><body>  foo  </body></html>",
    );

    const patch = diff(current, target);

    asserts.assertEquals(patch, {
        type: PatchType.UPDATE_ELEMENT,
        children: [
            { type: PatchType.UPDATE_ELEMENT, children: [], attributes: [] },
            {
                type: PatchType.UPDATE_ELEMENT,
                children: [{
                    type: PatchType.PRESERVE_NODE,
                }],
                attributes: [],
            },
        ],
        attributes: [],
    });
});

Deno.test("diff: document with comment changes", () => {
    const current = document(
        "<html><head></head><body><!--foo--></body></html>",
    );
    const target = document(
        "<html><head></head><body><!--bar--></body></html>",
    );

    const patch = diff(current, target);

    asserts.assertEquals(patch, {
        type: PatchType.UPDATE_ELEMENT,
        children: [
            { type: PatchType.UPDATE_ELEMENT, children: [], attributes: [] },
            {
                type: PatchType.UPDATE_ELEMENT,
                children: [{
                    type: PatchType.REPLACE_NODE,
                    node: target.body.firstChild?.cloneNode(true) as Node,
                }],
                attributes: [],
            },
        ],
        attributes: [],
    });
});

Deno.test("diff: document with node tag change", () => {
    const current = document(
        "<html><head></head><body><div></div></body></html>",
    );
    const target = document(
        "<html><head></head><body><span>toto</span></body></html>",
    );

    const patch = diff(current, target);

    asserts.assertEquals(patch, {
        type: PatchType.UPDATE_ELEMENT,
        children: [
            { type: PatchType.UPDATE_ELEMENT, children: [], attributes: [] },
            {
                type: PatchType.UPDATE_ELEMENT,
                children: [{
                    type: PatchType.REPLACE_NODE,
                    node: target.querySelector("span")?.cloneNode(true) as Node,
                }],
                attributes: [],
            },
        ],
        attributes: [],
    });
});

Deno.test("diff: document with node deletion", () => {
    const current = document(
        "<html><head></head><body><div></div></body></html>",
    );
    const target = document(
        "<html><head></head><body></body></html>",
    );

    const patch = diff(current, target);

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

Deno.test("diff: document with node insertion", () => {
    const current = document(
        "<html><head></head><body><div></div></body></html>",
    );
    const target = document(
        "<html><head></head><body><div></div><span></span></body></html>",
    );

    const patch = diff(current, target);

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
                    node: target.querySelector("span")?.cloneNode(true) as Node,
                }],
                attributes: [],
            },
        ],
        attributes: [],
    });
});

Deno.test("diff: head handling", () => {
    const current = document(
        '<html><head><base href="foo" /><!--foo--><title>title</title></head></html>',
    );
    const target = document(
        '<html><head><title>updated</title><base href="bar" /></head></html>',
    );

    const patch = diff(current, target);

    asserts.assertEquals(patch, {
        type: PatchType.UPDATE_ELEMENT,
        children: [
            {
                type: PatchType.UPDATE_ELEMENT,
                children: [
                    {
                        type: PatchType.UPDATE_ELEMENT,
                        children: [],
                        attributes: [{
                            type: PatchType.SET_ATTRIBUTE,
                            name: "href",
                            value: "bar",
                        }],
                    },
                    { type: PatchType.PRESERVE_NODE },
                    {
                        type: PatchType.UPDATE_ELEMENT,
                        children: [{
                            type: PatchType.UPDATE_TEXT,
                            text: "updated",
                        }],
                        attributes: [],
                    },
                ],
                attributes: [],
            },
            { type: PatchType.UPDATE_ELEMENT, children: [], attributes: [] },
        ],
        attributes: [],
    });
});

Deno.test("diff: head link", () => {
    const current = document(
        `<html><head>
            <link rel="same" href="same" as="same"/>
            <link rel="different" href="different" as="different">
            <link rel="removed" href="removed">
        </head></html>`,
    );
    const target = document(
        `<html><head>
            <link rel="added" href="added">
            <link rel="different" href="different" as="updated">
            <link rel="same" href="same" as="same"/>
        </head></html>`,
    );

    const patch = diff(current, target);

    asserts.assertEquals(patch, {
        type: PatchType.UPDATE_ELEMENT,
        children: [
            {
                type: PatchType.UPDATE_ELEMENT,
                children: [
                    // whitespace
                    { type: PatchType.PRESERVE_NODE },
                    // <link rel="same" href="same" as="same"/>
                    { type: PatchType.PRESERVE_NODE },
                    // whitespace
                    { type: PatchType.PRESERVE_NODE },
                    // <link rel="different" href="different" as="different">
                    {
                        type: PatchType.UPDATE_ELEMENT,
                        attributes: [{
                            type: PatchType.SET_ATTRIBUTE,
                            name: "as",
                            value: "updated",
                        }],
                        children: [],
                    },
                    // whitespace
                    { type: PatchType.PRESERVE_NODE },
                    // <link rel="removed" href="removed">
                    { type: PatchType.REMOVE_NODE },
                    // whitespace
                    { type: PatchType.PRESERVE_NODE },
                    {
                        type: PatchType.APPEND_NODE,
                        node: target.querySelector('link[rel="added"]')
                            ?.cloneNode(true) as Node,
                    },
                ],
                attributes: [],
            },
            { type: PatchType.UPDATE_ELEMENT, children: [], attributes: [] },
        ],
        attributes: [],
    });
});

Deno.test("diff: head meta", () => {
    const current = document(
        `<html><head>
            <meta http-equiv="same" content="same" />
            <meta http-equiv="different" content="different" />
            <meta property="different" content="different" />
            <meta name="removed" content="removed" />
            <meta property="same" content="same" />
            <meta property="removed" content="removed" />
            <meta name="different" content="different" />
            <meta name="same" content="same" />
            <meta http-equiv="removed" content="removed" />
        </head></html>`,
    );

    const target = document(
        `<html><head>
            <meta name="same" content="same" />
            <meta http-equiv="same" content="same" />
            <meta name="different" content="updated" />
            <meta name="added" content="added" />
            <meta property="different" content="updated" />
            <meta http-equiv="added" content="added" />
            <meta http-equiv="different" content="updated" />
            <meta property="same" content="same" />
            <meta property="added" content="added" />
        </head></html>`,
    );

    const patch = diff(current, target);

    asserts.assertEquals(patch, {
        type: PatchType.UPDATE_ELEMENT,
        children: [
            {
                type: PatchType.UPDATE_ELEMENT,
                children: [
                    // whitespace
                    { type: PatchType.PRESERVE_NODE },
                    // <meta http-equiv="same" content="same" />
                    { type: PatchType.PRESERVE_NODE },
                    // whitespace
                    { type: PatchType.PRESERVE_NODE },
                    // <meta http-equiv="different" content="different/updated" />
                    {
                        type: PatchType.UPDATE_ELEMENT,
                        children: [],
                        attributes: [{
                            type: PatchType.SET_ATTRIBUTE,
                            name: "content",
                            value: "updated",
                        }],
                    },
                    // whitespace
                    { type: PatchType.PRESERVE_NODE },
                    // <meta property="different" content="different" />
                    {
                        type: PatchType.UPDATE_ELEMENT,
                        children: [],
                        attributes: [{
                            type: PatchType.SET_ATTRIBUTE,
                            name: "content",
                            value: "updated",
                        }],
                    },
                    // whitespace
                    { type: PatchType.PRESERVE_NODE },
                    // <meta name="removed" content="removed" />
                    { type: PatchType.REMOVE_NODE },
                    // whitespace
                    { type: PatchType.PRESERVE_NODE },
                    // <meta property="same" content="same" />
                    { type: PatchType.PRESERVE_NODE },
                    // whitespace
                    { type: PatchType.PRESERVE_NODE },
                    // <meta property="removed" content="removed" />
                    { type: PatchType.REMOVE_NODE },
                    // whitespace
                    { type: PatchType.PRESERVE_NODE },
                    // <meta name="different" content="different" />
                    {
                        type: PatchType.UPDATE_ELEMENT,
                        children: [],
                        attributes: [{
                            type: PatchType.SET_ATTRIBUTE,
                            name: "content",
                            value: "updated",
                        }],
                    },
                    // whitespace
                    { type: PatchType.PRESERVE_NODE },
                    // <meta name="same" content="same" />
                    { type: PatchType.PRESERVE_NODE },
                    // whitespace
                    { type: PatchType.PRESERVE_NODE },
                    // <meta http-equiv="removed" content="removed" />
                    { type: PatchType.REMOVE_NODE },
                    // whitespace
                    { type: PatchType.PRESERVE_NODE },
                    // <meta name="added" content="added" />
                    {
                        type: PatchType.APPEND_NODE,
                        node: target.querySelector('meta[name="added"]')
                            ?.cloneNode(true) as Node,
                    },
                    // <meta http-equiv="added" content="added" />
                    {
                        type: PatchType.APPEND_NODE,
                        node: target.querySelector('meta[http-equiv="added"]')
                            ?.cloneNode(true) as Node,
                    },
                    // <meta property="added" content="added" />
                    {
                        type: PatchType.APPEND_NODE,
                        node: target.querySelector('meta[property="added"]')
                            ?.cloneNode(true) as Node,
                    },
                ],
                attributes: [],
            },
            { type: PatchType.UPDATE_ELEMENT, children: [], attributes: [] },
        ],
        attributes: [],
    });
});

Deno.test("diff: empty node to node with text", () => {
    const current = document(
        "<html><head></head><body><div></div></body></html>",
    );
    const target = document(
        "<html><head></head><body><div>content</div></body></html>",
    );

    const patch = diff(current, target);

    asserts.assertEquals(patch, {
        type: PatchType.UPDATE_ELEMENT,
        children: [
            { type: PatchType.UPDATE_ELEMENT, children: [], attributes: [] },
            {
                type: PatchType.UPDATE_ELEMENT,
                children: [{
                    type: PatchType.UPDATE_ELEMENT,
                    children: [{
                        type: PatchType.APPEND_NODE,
                        node: current.createTextNode("content"),
                    }],
                    attributes: [],
                }],
                attributes: [],
            },
        ],
        attributes: [],
    });
});

function document(markup: string) {
    return parser.parseFromString(markup, "text/html") as unknown as Document;
}
