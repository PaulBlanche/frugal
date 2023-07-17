const KEY_FORMAT = "jwk";
const KEY_ALGORITHM: HmacKeyGenParams = { name: "HMAC", hash: "SHA-512" };
const KEY_EXTRACTABLE = true;
const KEY_USAGE: KeyUsage[] = ["sign", "verify"];

export async function importKey(key: string): Promise<CryptoKey> {
    const importkey = JSON.parse(atob(key));

    return await crypto.subtle.importKey(
        KEY_FORMAT,
        importkey,
        KEY_ALGORITHM,
        KEY_EXTRACTABLE,
        KEY_USAGE,
    );
}

export async function exportKey(): Promise<string> {
    const key = await crypto.subtle.generateKey(
        KEY_ALGORITHM,
        KEY_EXTRACTABLE,
        KEY_USAGE,
    );

    const exportKey = await crypto.subtle.exportKey(KEY_FORMAT, key);
    return btoa(JSON.stringify(exportKey));
}

const ENCODER = new TextEncoder();

export async function sign(cryptoKey: CryptoKey, data: string) {
    const signature = await crypto.subtle.sign(KEY_ALGORITHM, cryptoKey, ENCODER.encode(data));
    return toHexString(new Uint8Array(signature));
}

export async function verify(cryptoKey: CryptoKey, signature: string, data: string) {
    return await crypto.subtle.verify(KEY_ALGORITHM, cryptoKey, fromHexString(signature), ENCODER.encode(data));
}

function toHexString(bytes: Uint8Array) {
    return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
}

function fromHexString(string: string): Uint8Array {
    const bytes = string.match(/.{1,2}/g)?.map((byte) => {
        return parseInt(byte, 16);
    }) ?? [];
    return new Uint8Array(bytes);
}
