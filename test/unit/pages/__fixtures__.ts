import { EmptyResponse } from '../../../src/page/FrugalResponse.ts';
import * as page from '../../../src/page/Page.ts';
import * as descriptor from '../../../src/page/PageDescriptor.ts';
import { PageGenerator, PageGeneratorConfig } from '../../../src/page/PageGenerator.ts';
import { CacheEntry, ResponseCache } from '../../../src/page/ResponseCache.ts';
import { BuildCache } from '../../../src/persistence/BuildCache.ts';
import { Cache, CacheConfig } from '../../../src/persistence/Cache.ts';
import { SerializedCache } from '../../../src/persistence/Cache.ts';
import { Persistence } from '../../../src/persistence/Persistence.ts';

export function fakeDynamicPage<DATA = unknown, PATH extends string = string>({
    self = 'file:///',
    pattern = '',
    getContent = () => '',
    GET = () => new EmptyResponse(),
    ...rest
}: Partial<descriptor.DynamicPageDescriptor<DATA, PATH>> = {}) {
    return new page.DynamicPage<DATA, PATH>({
        type: 'dynamic',
        self,
        pattern,
        getContent,
        GET,
        ...rest,
    });
}

export function fakeStaticPage<DATA = unknown, PATH extends string = string>({
    self = 'file:///',
    pattern = '',
    getContent = () => '',
    ...rest
}: Partial<descriptor.StaticPageDescriptor<DATA, PATH>> = {}) {
    return new page.StaticPage<DATA, PATH>({
        self,
        pattern,
        getContent,
        ...rest,
    });
}

type FakeBuildCacheConfig<VALUE> = {
    serializedCache: SerializedCache<VALUE>;
    config: Partial<CacheConfig>;
};

export function fakeBuildCache<VALUE>({
    serializedCache = { hash: '', data: {} },
    config: { hash = '', persistence = new MemoryPersistence() } = {},
}: Partial<FakeBuildCacheConfig<VALUE>> = {}) {
    return new BuildCache(serializedCache, { hash, persistence });
}

type FakeResponseCacheConfig = {
    cache: Cache<CacheEntry>;
    persistence: Persistence;
};

export function fakeResponseCache(
    { cache = fakeBuildCache<CacheEntry>(), persistence = new MemoryPersistence() }: Partial<
        FakeResponseCacheConfig
    > = {},
) {
    return new ResponseCache(cache, persistence);
}

export function fakePageGenerator<DATA = unknown, PATH extends string = string>(
    {
        page = fakeDynamicPage(),
        assets = {},
        descriptor = '',
        watch,
    }: Partial<PageGeneratorConfig<DATA, PATH>> = {},
) {
    return new PageGenerator({
        page,
        assets,
        descriptor,
        watch,
    });
}

export class MemoryPersistence implements Persistence {
    memory: Map<string, string>;

    constructor() {
        this.memory = new Map();
    }

    set(path: string, content: string) {
        this.memory.set(path, content);
        return Promise.resolve();
    }

    get(path: string) {
        const content = this.memory.get(path);
        return Promise.resolve(content);
    }

    delete(path: string) {
        this.memory.delete(path);
        return Promise.resolve();
    }
}
