import * as log from '../log/mod.ts';
import { Loader } from './loader.ts';
import * as importmap from '../../dep/importmap.ts';
import * as path from '../../dep/std/path.ts';
import { Page } from './Page.ts';
import { FilesystemPersistance, Persistance } from './Persistance.ts';

// TODO(PaulBlanche): add config validator

export type Config = {
    /** Trigger development mode : all pages are considered dynamic pages */
    devMode?: boolean;
    /** The URL of the module containing the config module (usually
     * `import.meta.url`). All relative paths will be resolved relatively to
     * this */
    self: URL;
    /** The root of the project. Defaults to `.` (the directory of the config
     * module) */
    root?: URL;
    /** The url of an import map */
    importMap?: string;
    /** The list of all loaders */
    loaders?: Loader<unknown>[];
    /** the output directory (where frugal will setup its cache and public
     * directory) */
    outputDir: string;
    /** The lis of registered pages */
    // deno-lint-ignore no-explicit-any
    pages: Page<any, any, any>[];
    /** An optional persistance layer for page cache, if you run frugal in a
     * distributed environment. Default on Filesystem */
    pagePersistance?: Persistance;
    /** An optional persistance layer for frugal cache, if you build/load frugal
     * in a distributed environment. Default on Filesystem */
    cachePersistance?: Persistance;
    /** the loggers config */
    logging?: log.Config;
};

export const OFF_LOGGER_CONFIG: log.Config = {
    type: 'human',
    loggers: {
        'frugal:asset': 'NOTSET',
        'frugal:Cache': 'NOTSET',
        'frugal:Frugal': 'NOTSET',
        'frugal:FrugalBuilder': 'NOTSET',
        'frugal:FrugalContext': 'NOTSET',
        'frugal:LoaderContext': 'NOTSET',
        'frugal:PageBuilder': 'NOTSET',
        'frugal:PageGenerator': 'NOTSET',
        'frugal:PageRefresher': 'NOTSET',
        'frugal:dependency_graph': 'NOTSET',
        'frugal:DependencyGraph': 'NOTSET',
        'frugal:loader:jsx_svg': 'NOTSET',
        'frugal:loader:script': 'NOTSET',
        'frugal:loader:style': 'NOTSET',
    },
};

export const DEFAULT_LOGGER_CONFIG: log.Config = {
    type: 'human',
    loggers: {
        'frugal:asset': 'INFO',
        'frugal:Cache': 'INFO',
        'frugal:Frugal': 'INFO',
        'frugal:FrugalBuilder': 'INFO',
        'frugal:FrugalContext': 'INFO',
        'frugal:LoaderContext': 'INFO',
        'frugal:PageBuilder': 'INFO',
        'frugal:PageGenerator': 'INFO',
        'frugal:PageRefresher': 'INFO',
        'frugal:dependency_graph': 'INFO',
        'frugal:DependencyGraph': 'INFO',
        'frugal:loader:jsx_svg': 'INFO',
        'frugal:loader:script': 'INFO',
        'frugal:loader:style': 'INFO',
    },
};

/**
 * A config object, wrapping the actual config with convinence methods.
 */
export class CleanConfig {
    #config: Config;
    #importMap: importmap.ImportMap;
    #importMapFile?: string;

    /**
     * Load the given config
     */
    static async load(config: Config) {
        const cleanConfig = new CleanConfig(
            config,
            await loadImportMap(config),
            config.importMap,
        );

        return cleanConfig;
    }

    constructor(
        config: Config,
        importMap: importmap.ImportMap,
        importMapFile?: string,
    ) {
        this.#config = config;
        this.#importMap = importmap.resolveImportMap(importMap, this.root);
        this.#importMapFile = importMapFile
            ? new URL(importMapFile, this.root).pathname
            : undefined;
    }

    /**
     * Get a logger config object (with automatic fallback on default)
     */
    get loggingConfig() {
        const config = this.#config.logging;
        return {
            type: config?.type ?? DEFAULT_LOGGER_CONFIG.type,
            loggers: {
                ...DEFAULT_LOGGER_CONFIG.loggers,
                ...config?.loggers,
            },
        };
    }

    /**
     * Get the page persistance layer (with automatic fallbakc on Filesystem)
     */
    get pagePersistance() {
        return this.#config.pagePersistance ??
            new FilesystemPersistance();
    }

    /**
     * Get the cache persistance layer (with automatic fallbakc on Filesystem)
     */
    get cachePersistance() {
        return this.#config.cachePersistance ??
            new FilesystemPersistance();
    }

    /**
     * Return the root of the project (either `self` or `root` relative to
     * `self` if `root` is set)
     */
    get root() {
        return configRoot(this.#config);
    }

    get pages() {
        return this.#config.pages;
    }

    get self() {
        return this.#config.self;
    }

    get loaders() {
        return this.#config.loaders ?? [];
    }

    /**
     * Return the resolved outputDir
     */
    get outputDir() {
        return path.resolve(this.root.pathname, this.#config.outputDir);
    }

    /**
     * Return the resolved public directory (a `'public'` directory inside `outputDir`)
     */
    get publicDir() {
        return path.resolve(this.outputDir, 'public');
    }

    /**
     * Return the resolved cache directory (a `'.cache'` directory inside `outputDir`)
     */
    get cacheDir() {
        return path.resolve(this.outputDir, '.cache');
    }

    get devMode() {
        return this.#config.devMode;
    }

    get importMapFile() {
        return this.#importMapFile;
    }

    /**
     * Return a resolve method generated from the config import map.
     */
    get resolve() {
        if (this.#importMap === undefined) return undefined;
        return (specifier: string, referer: URL) => {
            return new URL(
                importmap.resolveModuleSpecifier(
                    specifier,
                    this.#importMap,
                    referer,
                ),
            );
        };
    }
}

async function loadImportMap(config: Config): Promise<importmap.ImportMap> {
    if (config.importMap === undefined) {
        return {};
    }

    const importMapUrl = new URL(
        config.importMap,
        configRoot(config),
    );

    const source = await Deno.readTextFile(importMapUrl);

    return importmap.resolveImportMap(JSON.parse(source), importMapUrl);
}

function configRoot(config: Config) {
    return new URL(config.root ?? '.', config.self);
}
