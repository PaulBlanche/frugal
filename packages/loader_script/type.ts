export type Facade = {
    entrypoint: string;
    bundle: string;
    content: string;
};

export type BundlerParams = {
    facades: Facade[];
    importMapURL?: URL;
    publicDir: string;
    cacheDir: string;
    rootDir: string;
    outputDir: string;
};
