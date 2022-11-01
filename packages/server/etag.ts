import { Hash } from '../murmur/mod.ts';

export function compute(content: string) {
    return `W/"${new Hash().update(content).digest()}"`;
}
