/**
 * @param {string} source
 * @param {string} mask
 * @returns {string}
 */
export function xor(source, mask) {
    const masked = [];
    for (let i = 0, l = mask.length; i < l; i++) {
        masked[i] = String.fromCharCode(source.charCodeAt(i) ^ mask.charCodeAt(i));
    }
    return masked.join("");
}
