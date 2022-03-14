import * as log from '../log/mod.ts';
import { Loader } from './loader.ts';
import * as importmap from '../../dep/importmap.ts';
import * as path from '../../dep/std/path.ts';

export type Config = {
    root: string;
    importMap?: string;
    loaders?: Loader<any>[];
    outputDir: string;
    pages: string[];
    logging?: {
        build: log.Config
        server?: log.Config
    } | { 
        build?: log.Config
        server: log.Config
    } | log.Config
};

interface CleanConfigBase {
    root: string;
    loaders: Loader<any>[],
    pages: string[]
}

const DEFAULT_LOGGER_CONFIG: log.Config = {
    type: 'human',
    loggers: {
        'frugal:asset': 'INFO',
        'frugal:Builder': 'INFO',
        'frugal:FrugalContext': 'INFO',
        'frugal:PageRegenerator': 'INFO',
        'frugal:PageBuilder': 'INFO',
        'frugal:Regenerator': 'INFO',
        'frugal:Cache': 'INFO',
        'frugal:dependency_graph': 'INFO',
        'frugal:RegeneratorWorker': 'INFO',
        'frugal:loader:jsx_svg': 'INFO',
        'frugal:loader:script': 'INFO',
        'frugal:loader:style': 'INFO',
    },
};

export class CleanConfig implements CleanConfigBase {
    private config: Config
    private importMap: importmap.ImportMap

    static async load(config: Config) {
        return new CleanConfig(
            config,
            await this.loadImportMap(config)    
        )
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
        this.config = config
        this.importMap = importMap
        this.setupBuildLogging()
    }    

    private getBuildLoggingConfig(config: Config): log.Config|undefined {
        if (config.logging === undefined) {
            return undefined
        }
        
        if ('build' in config.logging || 'server' in config.logging) {
            return config.logging.build
        }
    
        return config.logging
    }
    
    private getServerLoggingConfig(config: Config): log.Config|undefined {
        if (config.logging === undefined) {
            return undefined
        }
        
        if ('build' in config.logging || 'server' in config.logging) {
            return config.logging.server 
        }
    
        return config.logging
    }

    setupServerLogging() {
        const serverLoggingConfig = this.getServerLoggingConfig(this.config)

        log.setup({
            type: serverLoggingConfig?.type ?? DEFAULT_LOGGER_CONFIG.type,
            loggers: {
                ...DEFAULT_LOGGER_CONFIG.loggers,
                ...serverLoggingConfig?.loggers,        
            }
        })
    }

    setupBuildLogging() {
        const buildLoggingConfig = this.getBuildLoggingConfig(this.config)

        log.setup({
            type: buildLoggingConfig?.type ?? DEFAULT_LOGGER_CONFIG.type,
            loggers: {
                ...DEFAULT_LOGGER_CONFIG.loggers,
                ...buildLoggingConfig?.loggers,        
            }
        })
    }

    get root() {
        return path.dirname(this.config.root)
    }

    get loaders() {
        return this.config.loaders ?? []
    }

    get pages() {
        return this.config.pages
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
        if (this.importMap === undefined) { return undefined }
        return (specifier: string, referer: URL) => {
            return new URL(
                importmap.resolve(
                    specifier,
                    this.importMap,
                    referer.toString(),
                ),
            );
        }
    }

    get configPath() {
        return this.config.root
    }
}
