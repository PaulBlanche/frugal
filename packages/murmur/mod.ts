import MurmurHash3 from '../../dep/murmurhash.ts';

type DigestType = 'raw' | 'alphanumeric';

/**
 * Thin wrapper around `MurmurHash3`
 */
export class Hash extends MurmurHash3 {
    constructor(key?: string, seed?: number) {
        super(key, seed);
    }

    /**
     * update the hash content with the given `data`.
     */
    update(data: string | Hash): Hash {
        this.hash(data instanceof Hash ? data.digest() : data);
        return this;
    }

    /**
     * compute the digest of all data passed to the hash. The digest can either
     * be:
     *   - `'raw'`, returning a 32-bit positive integer (the raw result of the
     *     mumrmurHash algorithm)
     *   - `'alphanumeric'` (default), returning an alphanumeric string
     *     ([a-z0-9])
     */
    digest(type: 'raw'): number;
    digest(type?: 'alphanumeric'): string;
    digest(type?: DigestType): string | number {
        switch (type) {
            case 'raw':
                return this.result();
            case undefined:
            case 'alphanumeric':
            default:
                return this.result().toString(36);
        }
    }
}
