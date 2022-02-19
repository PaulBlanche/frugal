import { default as MurmurHash3 } from '../../dep/murmurhash.ts';

export class Hash {
    murmur: MurmurHash3;

    constructor() {
        this.murmur = new MurmurHash3();
    }

    update(data: string | Hash) {
        this.murmur.hash(data instanceof Hash ? data.alphabetic() : data);
        return this;
    }

    alphabetic() {
        return this.murmur.result().toString(36);
    }

    number() {
        return this.murmur.result();
    }
}
