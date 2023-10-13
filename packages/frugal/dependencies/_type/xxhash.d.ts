export interface Hasher {
    update(data: Uint8Array | string): Hasher;
    digest(): string;
}
