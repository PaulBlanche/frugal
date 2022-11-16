export type Diff = {
    patch: NodePatch;
    node: Document;
};

export type NodePatch =
    | { type: PatchType.PRESERVE_NODE }
    | { type: PatchType.REMOVE_NODE }
    | { type: PatchType.APPEND_NODE; node: Node }
    | { type: PatchType.REPLACE_NODE; node: Node }
    | { type: PatchType.UPDATE_TEXT; text: string }
    | UpdateElementPatch;

export type UpdateElementPatch = {
    type: PatchType.UPDATE_ELEMENT;
    children: NodePatch[];
    attributes: AttributePatch[];
};

export type AttributePatch =
    | { type: PatchType.REMOVE_ATTRIBUTE; name: string }
    | { type: PatchType.SET_ATTRIBUTE; name: string; value: string | true };

export const enum PatchType {
    PRESERVE_NODE,
    REMOVE_NODE,
    APPEND_NODE,
    REPLACE_NODE,
    UPDATE_TEXT,
    UPDATE_ELEMENT,
    REMOVE_ATTRIBUTE,
    SET_ATTRIBUTE,
}

export const enum NodeType {
    ELEMENT_NODE = 1,
    TEXT_NODE = 3,
    DOCUMENT_NODE = 9,
}
