import * as xxhash from "../../dep/xxhash.ts";

export async function compute(content: string) {
    return `W/"${(await xxhash.create()).update(content).digest("hex")}"`;
}
