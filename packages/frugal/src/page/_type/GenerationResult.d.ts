import { Phase } from "./PageDescriptor.js";
import { JSONValue } from "./JSONValue.js";
import { Render } from "./PageDescriptor.js";
import { PathObject } from "./PathObject.js";
import { Assets } from "../Assets.js";

export type GenerationResultInit<PATH extends string, DATA extends JSONValue> = {
    phase: Phase;
    path: PathObject<PATH>;
    pathname: string;
    moduleHash: string;
    configHash: string;
    render: Render<PATH, DATA>;
    descriptor: string;
    assets: Assets;
};

export type SerializedGenerationResult = {
    path: string;
    hash: string;
    body?: string;
    headers: [string, string][];
    status?: number;
};
