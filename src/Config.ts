import * as esbuild from "../dep/esbuild.ts";
import * as importmap from "../dep/importmap.ts";
import * as path from "../dep/std/path.ts";

import * as log from "./log.ts";
import { Plugin } from "./Plugin.ts";
import { Budget, BudgetConfig } from "./Budget.ts";
import { Exporter } from "./export/Export.ts";
import { Middleware } from "./server/Middleware.ts";
import { SessionStorage } from "./server/session/SessionStorage.ts";
import { CookieConfig } from "./server/session/CookieConfig.ts";
import { Context } from "./server/Context.ts";

export type Config = {
    self: string;
    pages: string[];
    outdir?: string;
    staticdir?: string;
    importMap?: string;
    log?: Partial<log.LogConfig>;
    globalCss?: string;
    esbuild?: Pick<
        esbuild.BuildOptions,
        | "splitting"
        | "preserveSymlinks"
        | "external"
        | "packages"
        | "alias"
        | "loader"
        | "resolveExtensions"
        | "mainFields"
        | "conditions"
        | "publicPath"
        | "entryNames" // only for assets
        | "chunkNames" // only for assets
        | "assetNames" // only for assets
        | "target" // only for assets
        | "inject"
        | "banner"
        | "footer"
        | "stdin"
        | "plugins"
        | "nodePaths"
        | "sourcemap"
        | "legalComments"
        | "sourceRoot"
        | "sourcesContent"
        | "mangleProps"
        | "reserveProps"
        | "mangleQuoted"
        | "mangleCache"
        | "drop"
        | "minify"
        | "minifyWhitespace"
        | "minifyIdentifiers"
        | "minifySyntax"
        | "charset"
        | "treeShaking"
        | "ignoreAnnotations"
        | "define"
        | "pure"
        | "keepNames"
        | "jsx"
        | "jsxDev"
        | "jsxSideEffects"
        | "jsxFragment"
        | "jsxImportSource"
    >;
    server?: ServerConfig;
    plugins?: Plugin[];
    budget?: BudgetConfig;
    exporter?: Exporter;
};

type ServerConfig = {
    secure?: boolean;
    port?: number;
    cryptoKey?: CryptoKey;
    session?: {
        storage: SessionStorage;
        cookie?: CookieConfig;
    };
    csrf?: {
        cookieName?: string;
        fieldName?: string;
        headerName?: string;
        isProtected?: (url: URL) => boolean;
    };
    middlewares?: Middleware<Context>[];
};

export class FrugalServerConfig {
    #config: ServerConfig;

    constructor(config: ServerConfig) {
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

export class FrugalConfig {
    #config: Config;
    #importMapURL?: URL;
    #importMap?: Promise<importmap.ImportMap>;
    #serverConfig: FrugalServerConfig;
    #budget: Budget;

    constructor(config: Config) {
        this.#config = config;

        if (this.#config.log) {
            log.config(this.#config.log);
        }

        this.#budget = new Budget(config.budget);

        this.#importMapURL = config.importMap ? new URL(config.importMap, this.#config.self) : undefined;

        if (this.#importMapURL) {
            this.#importMap = loadImportMap(this.#importMapURL);
        }

        this.#serverConfig = new FrugalServerConfig(config.server ?? {});
    }

    get globalCss() {
        return this.#config.globalCss;
    }

    get plugins() {
        return (this.#config.plugins ?? []);
    }

    get budget() {
        return this.#budget;
    }

    get server() {
        return this.#serverConfig;
    }

    get self() {
        return new URL(this.#config.self);
    }

    get pages() {
        return this.#config.pages.map((page) => new URL(page, this.self));
    }

    get outdir() {
        return new URL(this.#config.outdir ?? "dist/", this.self);
    }

    get publicdir() {
        return new URL("public/", this.outdir);
    }

    get cachedir() {
        return new URL(".cache/", this.outdir);
    }

    get builddir() {
        return new URL("build/", this.cachedir);
    }

    get buildCacheFile() {
        return new URL("buildcache.json", this.cachedir);
    }

    get rootdir() {
        return new URL(".", this.#config.self);
    }

    get staticdir() {
        return new URL(this.#config.staticdir ?? "static/", this.self);
    }

    get exporter() {
        return this.#config.exporter;
    }

    get esbuildOptions() {
        return this.#config.esbuild;
    }

    get importMap() {
        return this.#importMap;
    }

    get importMapURL() {
        return this.#importMapURL;
    }

    resolve(specifier: string) {
        return path.fromFileUrl(new URL(specifier, this.rootdir));
    }
}

async function loadImportMap(importMapURL: URL) {
    const response = await fetch(importMapURL.href);
    const importMapData = await response.text();
    return importmap.resolveImportMap(
        JSON.parse(importMapData),
        importMapURL,
    );
}
