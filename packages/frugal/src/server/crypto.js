const KEY_FORMAT = "jwk";
/** @type {HmacKeyGenParams} */
const KEY_ALGORITHM = { name: "HMAC", hash: "SHA-512" };
const KEY_EXTRACTABLE = true;
/** @type {KeyUsage[]} */
const KEY_USAGE = ["sign", "verify"];

/**
 * @param {string} key
 * @returns {Promise<CryptoKey>}
 */
export async function importKey(key) {
    const importkey = JSON.parse(atob(key));

    return await crypto.subtle.importKey(
        KEY_FORMAT,
        importkey,
        KEY_ALGORITHM,
        KEY_EXTRACTABLE,
        KEY_USAGE,
    );
}

/** @returns {Promise<string>} */
export async function exportKey() {
    const key = await crypto.subtle.generateKey(KEY_ALGORITHM, KEY_EXTRACTABLE, KEY_USAGE);

    const exportKey = await crypto.subtle.exportKey(KEY_FORMAT, key);
    return btoa(JSON.stringify(exportKey));
}

const ENCODER = new TextEncoder();

/**
 * @param {CryptoKey} cryptoKey
 * @param {string} data
 */
export async function sign(cryptoKey, data) {
    const signature = await crypto.subtle.sign(KEY_ALGORITHM, cryptoKey, ENCODER.encode(data));
    return toHexString(new Uint8Array(signature));
}

/**
 * @param {CryptoKey} cryptoKey
 * @param {string} signature
 * @param {string} data
 * @returns
 */
export async function verify(cryptoKey, signature, data) {
    return await crypto.subtle.verify(
        KEY_ALGORITHM,
        cryptoKey,
        fromHexString(signature),
        ENCODER.encode(data),
    );
}

/** @param {Uint8Array} bytes */
function toHexString(bytes) {
    return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
}

/**
 * @param {string} string
 * @returns {Uint8Array}
 */
function fromHexString(string) {
    const bytes =
        string.match(/.{1,2}/g)?.map((byte) => {
            return parseInt(byte, 16);
        }) ?? [];
    return new Uint8Array(bytes);
}
