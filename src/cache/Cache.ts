import { GenerationResult } from "../page/GenerationResult.ts";
import { JSONValue } from "../page/JSONValue.ts";

export interface Cache {
    add<PATH extends string, DATA extends JSONValue>(response: GenerationResult<PATH, DATA>): Promise<void>;
}

export interface RuntimeCache extends Cache {
    get(path: string): Promise<Response | undefined>;
    has(path: string): Promise<boolean>;
}
