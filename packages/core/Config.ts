import * as log from '../log/mod.ts';
import { Loader } from './loader.ts';
import * as importmap from '../../dep/importmap.ts';
import * as path from '../../dep/std/path.ts';
import { Entrypoint } from './Entrypoint.ts';

export type Config = {
    root: string;
    importMap?: string;
    loaders?: Loader<any>[];
    outputDir: string;
    pages: string[];
    logging?: {
        build: log.Config;
        server?: log.Config;
    } | {
        build?: log.Config;
        server: log.Config;
    } | log.Config;
};

interface CleanConfigBase {
    root: string;
    loaders: Loader<any>[];
    entrypoints: Entrypoint[];
}

const DEFAULT_LOGGER_CONFIG: log.Config = {
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

export class CleanConfig implements CleanConfigBase {
    private config: Config;
    private importMap: importmap.ImportMap;
    entrypoints: Entrypoint[];
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
            new URL(config.importMap, `file:///${config.root}`),
        );

        return JSON.parse(source);
    }

    constructor(config: Config, importMap: importmap.ImportMap) {
        this.config = config;
        this.importMap = importMap;
        this.entrypoints = config.pages.map((page) =>
            new Entrypoint(page, this.root)
        );
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
        return this.config.root;
    }

    get loaders() {
        return this.config.loaders ?? [];
    }

    get publicDir() {
        return path.resolve(this.root, this.config.outputDir, 'public');
    }

    get serverDir() {
        return path.resolve(this.root, this.config.outputDir, 'server');
    }

    get cacheDir() {
        return path.resolve(this.root, this.config.outputDir, '.cache');
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
