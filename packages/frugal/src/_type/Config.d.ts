import * as esbuild from "../../dependencies/esbuild.js";
import * as log from "./log.js";
import { Exporter } from "../export/Exporter.js";
import { Plugin } from "../Plugin.js";
import { SessionStorage } from "../server/session/SessionStorage.js";
import { CookieConfig } from "../server/session/CookieConfig.js";
import { Middleware } from "../server/Middleware.js";
import { Context } from "../server/Context.js";

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
    exporter?: Exporter;
    cleanAll?: boolean;
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
