import * as log from '../log/mod.ts';
import { Loader } from './loader.ts';
import * as importmap from '../../dep/importmap.ts';
import * as path from '../../dep/std/path.ts';
import { Page } from './Page.ts';
import { FilesystemPersistance, Persistance } from './Persistance.ts';

// TODO(PaulBlanche): add config validator

export type Config = {
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

const LOGGERS = [
    'frugal:asset',
    'frugal:Cache',
    'frugal:Frugal',
    'frugal:FrugalBuilder',
    'frugal:FrugalContext',
    'frugal:LoaderContext',
    'frugal:PageBuilder',
    'frugal:PageGenerator',
    'frugal:PageRefresher',
    'frugal:dependency_graph',
    'frugal:DependencyGraph',
    'frugal:loader:jsx_svg',
    'frugal:loader:script',
    'frugal:loader:style',
];

function logger(level: log.Config['loggers'][string]) {
    return LOGGERS.reduce<log.Config['loggers']>((loggers, logger) => {
        loggers[logger] = level;
        return loggers;
    }, {});
}

export const OFF_LOGGER_CONFIG: log.Config = {
    type: 'human',
    loggers: logger('NOTSET'),
};

export const DEFAULT_LOGGER_CONFIG: log.Config = {
    type: 'human',
    loggers: logger('INFO'),
};

/**
 * A config object, wrapping the actual config with convinence methods.
 */
export class CleanConfig {
    #watch?: boolean;
    #config: Config;
    #importMap: importmap.ImportMap;
    #importMapURL?: URL;

    /**
     * Load the given config
     */
    static async load(
        config: Config,
        watch?: boolean,
    ) {
        const cleanConfig = new CleanConfig(
            config,
            await loadImportMap(config),
            config.importMap,
            watch,
        );

        return cleanConfig;
    }

    constructor(
        config: Config,
        importMap: importmap.ImportMap,
        importMapFile?: string,
        watch?: boolean,
    ) {
        this.#watch = watch;
        this.#config = config;
        this.#importMap = importmap.resolveImportMap(importMap, this.root);
        this.#importMapURL = importMapFile
            ? new URL(importMapFile, this.root)
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

    get watch() {
        return this.#watch;
    }

    get importMapURL() {
        return this.#importMapURL;
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
