import * as path from '../../dep/std/path.ts';
import * as fs from '../../dep/std/fs.ts';
import * as murmur from '../murmur/mod.ts';
import * as log from '../log/mod.ts';

import * as esbuild from '../../dep/esbuild.ts';
import { frugalPlugin, Transformer } from './frugalPlugin.ts';

function logger() {
    return log.getLogger('frugal:loader:script');
}

export type EsbuildConfig = Omit<
    esbuild.BuildOptions,
    | 'bundle'
    | 'entryPoints'
    | 'write'
    | 'metafile'
    | 'outdir'
    | 'plugins'
    | 'outfile'
    | 'outbase'
    | 'platform'
    | 'outExtension'
    | 'publicPath'
    | 'incremental'
    | 'stdin'
    | 'plugins'
    | 'absWorkingDir'
    | 'watch'
>;

type Facade = {
    bundle: string;
    entrypoint: string;
    content: string;
};

type Config = {
    rootDir: string;
    cacheDir: string;
    publicDir: string;
    facades: Facade[];
    transformers?: Transformer[];
    importMapURL?: URL;
};

export type BundleConfig = Config & EsbuildConfig;

export async function bundle(
    {
        cacheDir,
        publicDir,
        rootDir,
        facades,
        transformers,
        importMapURL,
        ...esbuildConfig
    }: BundleConfig,
): Promise<Record<string, Record<string, string>>> {
    const config = {
        cacheDir,
        publicDir,
        rootDir,
        facades,
        transformers,
        importMapURL,
    };

    const {
        entryPoints,
        facadeToEntrypoint,
    } = await generateEntrypoints(config);

    const result = await build(entryPoints, config, esbuildConfig);

    return write(result, facadeToEntrypoint, config);
}

type FacadeToEntrypoint = Record<string, {
    entrypoint: string;
    bundle: string;
}[]>;

async function generateEntrypoints(config: Config) {
    const facadeToEntrypoint: FacadeToEntrypoint = {};

    const entryPoints = await Promise.all(
        config.facades.map(async (facade, i) => {
            const facadeId = new murmur.Hash().update(facade.bundle).update(
                String(i),
            ).digest();

            const facadePath = path.join(
                config.cacheDir,
                'script_loader',
                `${facadeId}.ts`,
            );

            facadeToEntrypoint[`deno:file://${facadePath}`] =
                facadeToEntrypoint[`deno:file://${facadePath}`] ?? [];
            facadeToEntrypoint[`deno:file://${facadePath}`].push({
                entrypoint: facade.entrypoint,
                bundle: facade.bundle,
            });

            await fs.ensureFile(facadePath);
            await Deno.writeTextFile(facadePath, facade.content);
            return facadePath;
        }),
    );

    return { facadeToEntrypoint, entryPoints };
}

type BuildResult = esbuild.BuildIncremental & {
    outputFiles: esbuild.OutputFile[];
    metafile: esbuild.Metafile;
};

async function build(
    entryPoints: string[],
    config: Config,
    esbuildConfig: EsbuildConfig,
): Promise<BuildResult> {
    return await esbuild.build({
        ...esbuildConfig,
        entryPoints,
        bundle: true,
        write: false,
        metafile: true,
        platform: 'neutral',
        incremental: true,
        outdir: config.publicDir,
        entryNames: `js/${esbuildConfig.entryNames ?? '[dir]/[name]-[hash]'}`,
        chunkNames: `js/${esbuildConfig.chunkNames ?? '[dir]/[name]-[hash]'}`,
        assetNames: `js/${esbuildConfig.assetNames ?? '[dir]/[name]-[hash]'}`,
        plugins: [frugalPlugin({
            loader: 'portable',
            importMapURL: config.importMapURL,
            transformers: config.transformers,
        })],
    }) as BuildResult;
}

async function write(
    result: BuildResult,
    facadeToEntrypoint: FacadeToEntrypoint,
    config: Config,
) {
    const url: Record<string, Record<string, string>> = {};

    await Promise.all(result.outputFiles.map(async (outputFile) => {
        const relativeOutputPath = path.relative(Deno.cwd(), outputFile.path);
        const output = result.metafile.outputs[relativeOutputPath];

        // if the outputed file is an entry point
        if (output?.entryPoint) {
            const facades = facadeToEntrypoint[output.entryPoint];
            // if there is a matching facade, it means the entrypoint is a static
            // entrypoint (no dynamic import)
            if (facades !== undefined) {
                for (const { entrypoint, bundle } of facades) {
                    const entrypointKey = path.relative(
                        config.rootDir,
                        new URL(entrypoint).pathname,
                    );
                    url[entrypointKey] = url[entrypoint] ?? {};
                    url[entrypointKey][bundle] = `/${
                        path.relative(config.publicDir, outputFile.path)
                    }`;

                    logger().debug({
                        url: url[entrypointKey][bundle],
                        bundle,
                        page: entrypointKey,
                        msg() {
                            return `add ${this.url} for ${this.page} to bundle ${this.bundle}`;
                        },
                    });
                }
            }
        }

        await fs.ensureFile(outputFile.path);
        await Deno.writeFile(outputFile.path, outputFile.contents);
    }));

    const metaPath = path.join(config.publicDir, 'js', 'meta.json');
    await fs.ensureFile(metaPath);
    await Deno.writeTextFile(metaPath, JSON.stringify(result.metafile));

    return url;
}
