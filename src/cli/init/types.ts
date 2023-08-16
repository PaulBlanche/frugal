export enum ExportType {
    NO_EXPORT = "no-export",
    NGINX = "nginx",
    DENO = "deno",
}

export function toExportType(exportType?: string): ExportType | undefined {
    if (exportType === undefined) {
        return ExportType.NO_EXPORT;
    }

    if (Object.values(ExportType).includes(exportType as ExportType)) {
        return exportType as ExportType;
    }
}

export enum CacheType {
    NO_CACHE = "no-cache",
    DENO_KV = "deno-kv",
}

export function toCacheType(cacheType?: string): CacheType | undefined {
    if (cacheType === undefined) {
        return CacheType.NO_CACHE;
    }

    if (Object.values(CacheType).includes(cacheType as CacheType)) {
        return cacheType as CacheType;
    }
}

export enum Framework {
    NO_FRAMEWORK = "no-framework",
    PREACT = "preact",
    SVELTE = "svelte",
}

export function toFramework(framework?: string): Framework | undefined {
    if (framework === undefined) {
        return Framework.NO_FRAMEWORK;
    }

    if (Object.values(Framework).includes(framework as Framework)) {
        return framework as Framework;
    }
}

export function jsxConfig(
    framework: Framework,
): undefined | {
    deno: { jsxImportSource: string; jsx: string };
    esbuild: { jsxImportSource: string; jsx: string };
} {
    switch (framework) {
        case Framework.PREACT: {
            return {
                deno: { jsxImportSource: "preact", jsx: "react-jsx" },
                esbuild: { jsxImportSource: "preact", jsx: "automatic" },
            };
        }
    }
}

export const VALID_CACHE: Record<ExportType, CacheType[]> = {
    [ExportType.NO_EXPORT]: [CacheType.NO_CACHE],
    [ExportType.NGINX]: [CacheType.NO_CACHE],
    [ExportType.DENO]: [CacheType.DENO_KV],
};
