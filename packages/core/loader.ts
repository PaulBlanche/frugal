import { PersistantCache } from './Cache.ts';
import { CleanConfig } from './Config.ts';

export type Asset = {
    loader: string;
    module: string;
    hash: string;
    entrypoint: string;
};

export type GenerateParams<CACHED = unknown> = {
    getCache: () => Promise<PersistantCache<CACHED>>;
    assets: Asset[];
    config: CleanConfig;
};

export type Loader<GENERATED, CACHED = unknown> = {
    name: string;
    test: (url: URL) => boolean;
    generate(params: GenerateParams<CACHED>): Promise<GENERATED>;
    end?: () => void;
};
