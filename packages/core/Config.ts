import * as log from '../log/mod.ts';
import { Loader } from './loader.ts';
import * as importmap from '../../dep/importmap.ts';
import * as path from '../../dep/std/path.ts';
import { Page } from './Page.ts';
import { FilesystemPersistance, Persistance } from './Persistance.ts';

// TODO(PaulBlanche): add config validator
export type Config = {
    devMode?: boolean;
    self: URL;
    root?: URL;
    importMap?: string;
    loaders?: Loader<unknown>[];
    outputDir: string;
    // deno-lint-ignore no-explicit-any
    pages: Page<any, any, any>[];
    pagePersistance?: Persistance;
    cachePersistance?: Persistance;
    logging?: log.Config;
};

function configRoot(config: Config) {
    return new URL(config.root ?? '.', config.self);
}
export const OFF_LOGGER_CONFIG: log.Config = {
    type: 'human',
    loggers: {
        'frugal:asset': 'NOTSET',
        'frugal:Builder': 'NOTSET',
        'frugal:Cache': 'NOTSET',
        'frugal:Frugal': 'NOTSET',
        'frugal:FrugalContext': 'NOTSET',
        'frugal:Generator': 'NOTSET',
        'frugal:LoaderContext': 'NOTSET',
        'frugal:PageBuilder': 'NOTSET',
        'frugal:PageGenerator': 'NOTSET',
        'frugal:PageRefresher': 'NOTSET',
        'frugal:Refresher': 'NOTSET',
        'frugal:dependency_graph': 'NOTSET',
        'frugal:loader:jsx_svg': 'NOTSET',
        'frugal:loader:script': 'NOTSET',
        'frugal:loader:style': 'NOTSET',
    },
};

export const DEFAULT_LOGGER_CONFIG: log.Config = {
    type: 'human',
    loggers: {
        'frugal:asset': 'INFO',
        'frugal:Builder': 'INFO',
        'frugal:Cache': 'INFO',
        'frugal:Frugal': 'INFO',
        'frugal:FrugalContext': 'INFO',
        'frugal:Generator': 'INFO',
        'frugal:LoaderContext': 'INFO',
        'frugal:PageBuilder': 'INFO',
        'frugal:PageGenerator': 'INFO',
        'frugal:PageRefresher': 'INFO',
        'frugal:Refresher': 'INFO',
        'frugal:dependency_graph': 'INFO',
        'frugal:loader:jsx_svg': 'INFO',
        'frugal:loader:script': 'INFO',
        'frugal:loader:style': 'INFO',
    },
};

export class CleanConfig {
    private config: Config;
    private importMap: importmap.ImportMap;

    static async load(config: Config) {
        const cleanConfig = new CleanConfig(
            config,
            await this.loadImportMap(config),
        );

        return cleanConfig;
    }

    static async loadImportMap(config: Config): Promise<importmap.ImportMap> {
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

    constructor(config: Config, importMap: importmap.ImportMap) {
        this.config = config;
        this.importMap = importmap.resolveImportMap(importMap, this.root);
    }

    get loggingConfig() {
        const config = this.config.logging;
        return {
            type: config?.type ?? DEFAULT_LOGGER_CONFIG.type,
            loggers: {
                ...DEFAULT_LOGGER_CONFIG.loggers,
                ...config?.loggers,
            },
        };
    }

    get pagePersistance() {
        return this.config.pagePersistance ??
            new FilesystemPersistance();
    }

    get cachePersistance() {
        return this.config.cachePersistance ??
            new FilesystemPersistance();
    }

    get root() {
        return configRoot(this.config);
    }

    get pages() {
        return this.config.pages;
    }

    get self() {
        return this.config.self;
    }

    get loaders() {
        return this.config.loaders ?? [];
    }

    get outputDir() {
        console.log(this.root.pathname, this.config.outputDir);
        return path.resolve(this.root.pathname, this.config.outputDir);
    }

    get publicDir() {
        return path.resolve(this.outputDir, 'public');
    }

    get serverDir() {
        return path.resolve(this.outputDir, 'server');
    }

    get cacheDir() {
        return path.resolve(this.outputDir, '.cache');
    }

    get devMode() {
        return this.config.devMode;
    }

    get resolve() {
        if (this.importMap === undefined) return undefined;
        return (specifier: string, referer: URL) => {
            return new URL(
                importmap.resolveModuleSpecifier(
                    specifier,
                    this.importMap,
                    referer,
                ),
            );
        };
    }
}
