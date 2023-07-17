export type CacheStorage = {
    set(key: string, content: string): Promise<void>;
    get(key: string): Promise<string | undefined>;
    delete(key: string): Promise<void>;
    empty(): Promise<void>;
};
