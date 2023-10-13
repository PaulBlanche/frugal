import * as lexer from "../_dep/es-module-lexer.js";

/**
 * @param {string} source
 * @returns {Promise<string[]>}
 */
export async function parse(source) {
    await lexer.init;

    const [imports] = lexer.parse(source);

    return imports
        .map((entry) => entry.n)
        .filter(/** @returns {name is string} */ (name) => name !== undefined);
}
