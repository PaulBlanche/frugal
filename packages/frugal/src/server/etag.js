import * as xxhash from "../../dependencies/xxhash.js";
import * as fs from "../../dependencies/fs.js";

/**
 * @param {string} content
 * @returns {Promise<string>}
 */
export async function compute(content) {
    return (await xxhash.create()).update(content).digest();
}

/**
 * @param {fs.FileInfo} stats
 * @returns {Promise<string>}
 */
export async function computeWeak(stats) {
    return `W/${(await xxhash.create()).update(stats.mtime?.toJSON() ?? "empty").digest()}`;
}
