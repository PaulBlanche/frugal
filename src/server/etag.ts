import * as XX64 from '../../dep/xxhash.ts';

export async function compute(content: string) {
    return `W/"${(await XX64.create()).update(content).digest()}"`;
}
