export type CacheStorage = {
    set(key: string, content: string): Promise<void>;
    get(key: string): Promise<string | undefined>;
    delete(key: string): Promise<void>;
};

export interface CacheStorageCreator {
    instance(): {
        import: { name: string; url: string };
        instanceParams: (config: string, manifest: string, deploymentId: string) => string[];
    };
}
