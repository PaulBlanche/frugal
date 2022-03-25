import * as log from '../log/mod.ts';
import { Loader } from './loader.ts';
import * as importmap from '../../dep/importmap.ts';
import * as path from '../../dep/std/path.ts';
import { Page } from './Page.ts';

// TODO(PaulBlanche): add config validator
export type Config = {
    self: URL;
    root?: URL;
    importMap?: string;
    loaders?: Loader<any>[];
    outputDir: string;
    pages: Page<any, any>[];
    logging?: {
        build: log.Config;
        server?: log.Config;
    } | {
        build?: log.Config;
        server: log.Config;
    } | log.Config;
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
    loggingMode?: 'build' | 'server';

    static async load(config: Config) {
        const cleanConfig = new CleanConfig(
            config,
            await this.loadImportMap(config),
        );

        await cleanConfig.setupBuildLogging();

        return cleanConfig;
    }

    static async loadImportMap(config: Config) {
        if (config.importMap === undefined) {
            return undefined;
        }

        const source = await Deno.readTextFile(
            new URL(
                config.importMap,
                configRoot(config),
            ),
        );

        return JSON.parse(source);
    }

    constructor(config: Config, importMap: importmap.ImportMap) {
        this.config = config;
        this.importMap = importMap;
    }

    private getBuildLoggingConfig(config: Config): log.Config | undefined {
        if (config.logging === undefined) {
            return undefined;
        }

        if ('build' in config.logging || 'server' in config.logging) {
            return config.logging.build;
        }

        return config.logging;
    }

    private getServerLoggingConfig(config: Config): log.Config | undefined {
        if (config.logging === undefined) {
            return undefined;
        }

        if ('build' in config.logging || 'server' in config.logging) {
            return config.logging.server;
        }

        return config.logging;
    }

    async setupServerLogging() {
        if (this.loggingMode !== 'server') {
            this.loggingMode = 'server';
            const serverLoggingConfig = this.getServerLoggingConfig(
                this.config,
            );

            await log.setup({
                type: serverLoggingConfig?.type ?? DEFAULT_LOGGER_CONFIG.type,
                loggers: {
                    ...DEFAULT_LOGGER_CONFIG.loggers,
                    ...serverLoggingConfig?.loggers,
                },
            });
        }
    }

    async setupBuildLogging() {
        if (this.loggingMode !== 'build') {
            this.loggingMode = 'build';
            const buildLoggingConfig = this.getBuildLoggingConfig(this.config);

            await log.setup({
                type: buildLoggingConfig?.type ?? DEFAULT_LOGGER_CONFIG.type,
                loggers: {
                    ...DEFAULT_LOGGER_CONFIG.loggers,
                    ...buildLoggingConfig?.loggers,
                },
            });
        }
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

    get resolve() {
        if (this.importMap === undefined) return undefined;
        return (specifier: string, referer: URL) => {
            return new URL(
                importmap.resolve(
                    specifier,
                    this.importMap,
                    referer.toString(),
                ),
            );
        };
    }
}
