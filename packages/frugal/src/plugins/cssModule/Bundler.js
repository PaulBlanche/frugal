import * as _type from "./_type/Bundler.js";
export * from "./_type/Bundler.js";

import * as lightningcss from "../../../dependencies/lightningcss.js";

import { log } from "../../log.js";
import { Compiler } from "./Compiler.js";

export class Bundler {
    /** @type {Map<string, _type.Module>} */
    #cache;
    /** @type {_type.Config} */
    #config;

    /** @param {_type.Config} [config] */
    constructor(config = {}) {
        this.#cache = new Map();
        this.#config = config;
    }

    /**
     * @param {string} path
     * @param {string} cssPath
     * @param {Uint8Array} contents
     * @returns {Promise<_type.Module>}
     */
    async bundle(path, cssPath, contents) {
        const cached = this.#cache.get(path);
        if (cached && isSameUint8Array(cached.contents, contents)) {
            return cached;
        }

        log(`compiling css module "${path}"`, { scope: "frugal:cssModule", level: "debug" });

        const { css, exports } = this.#transform(path, contents);

        const js = new Compiler(exports ?? {}).compile(cssPath);

        const module = { contents, css, js };

        this.#cache.set(path, module);
        return module;
    }

    /**
     * @param {string} path
     * @param {Uint8Array} contents
     * @returns {{ css: Uint8Array; exports: lightningcss.CSSModuleExports | void }}
     */
    #transform(path, contents) {
        const { code, exports } = lightningcss.transform({
            filename: path,
            code: contents,
            cssModules: this.#config.options,
            sourceMap: this.#config.sourceMap,
            projectRoot: this.#config.projectRoot,
            targets: {
                chrome: 95 << 16,
            },
        });

        // copy css Uint8Array, because the underlying buffer coming from
        // lightningcss might become detached.
        const css = new Uint8Array(code.byteLength);

        css.set(code);

        return { css, exports };
    }
}

/**
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 * @returns {boolean}
 */
function isSameUint8Array(a, b) {
    if (a.byteLength !== b.byteLength) {
        return false;
    }

    for (let i = 0; i < a.byteLength; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
}
