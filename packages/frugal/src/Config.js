import * as _type from "./_type/Config.js";
export * from "./_type/Config.js";

import * as path from "../dependencies/path.js";

import * as log from "./log.js";

function isDeno() {
    return typeof Deno !== undefined;
}

function isNode() {
    return (
        Object.prototype.toString.call(typeof process !== "undefined" ? process : 0) ===
        "[object process]"
    );
}

export class FrugalConfig {
    /** @type {_type.Config} */
    #config;
    /** @type {FrugalServerConfig} */
    #serverConfig;
    /** @type {"deno" | "node"} */
    #platform;

    /** @param {_type.Config} config */
    constructor(config) {
        this.#config = config;

        if (isNode()) {
            this.#platform = "node";
        } else if (isDeno()) {
            this.#platform = "deno";
        } else {
            throw new Error("Unknown platform. Frugal only supports Node and Deno.");
        }

        if (this.#config.log) {
            log.config(this.#config.log);
        }

        this.#serverConfig = new FrugalServerConfig(config.server ?? {});
    }

    get platform() {
        return this.#platform;
    }

    get cleanAll() {
        return this.#config.cleanAll ?? true;
    }

    get globalCss() {
        return this.#config.globalCss;
    }

    get plugins() {
        return this.#config.plugins ?? [];
    }

    get server() {
        return this.#serverConfig;
    }

    get self() {
        return path.fromFileURL(this.#config.self);
    }

    get rootdir() {
        return path.dirname(this.self);
    }

    get pages() {
        return this.#config.pages.map((page) => path.resolve(this.rootdir, page));
    }

    get outdir() {
        return path.resolve(this.rootdir, this.#config.outdir ?? "dist/");
    }

    get publicdir() {
        return path.resolve(this.outdir, "public/");
    }

    get cachedir() {
        return path.resolve(this.outdir, ".cache/");
    }

    get tempdir() {
        return path.resolve(this.outdir, ".temp/");
    }

    get builddir() {
        return path.resolve(this.tempdir, "build/");
    }

    get buildCacheFile() {
        return path.resolve(this.cachedir, "buildcache.json");
    }

    get staticdir() {
        return path.resolve(this.rootdir, this.#config.staticdir ?? "static/");
    }

    get exporter() {
        return this.#config.exporter;
    }

    get esbuildOptions() {
        return this.#config.esbuild;
    }

    /** @param {string} specifier */
    resolve(specifier) {
        return path.resolve(this.rootdir, specifier);
    }
}

export class FrugalServerConfig {
    /** @type {_type.ServerConfig} */
    #config;

    /** @param {_type.ServerConfig} config */
    constructor(config) {
        this.#config = config;
    }

    get secure() {
        return this.#config.secure ?? false;
    }

    get port() {
        return this.#config.port ?? 8000;
    }

    get cryptoKey() {
        return this.#config.cryptoKey;
    }

    get session() {
        return this.#config.session;
    }

    get middlewares() {
        return this.#config.middlewares ?? [];
    }

    get csrf() {
        return this.#config.csrf;
    }
}
