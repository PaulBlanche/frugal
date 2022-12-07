import * as path from '../../dep/std/path.ts';
import * as fs from '../../dep/std/fs.ts';
import * as murmur from '../murmur/mod.ts';
import * as log from '../log/mod.ts';

import * as esbuild from '../../dep/esbuild.ts';
import { frugalPlugin, Transformer } from './frugalPlugin.ts';
import { BundlerParams } from './type.ts';

function logger() {
    return log.getLogger('frugal:loader:esbuildBundler');
}

type EsbuildConfig = Omit<
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

type BundlerConfig =
    & {
        transformers?: Transformer[];
    }
    & EsbuildConfig;

export function esbuildBundler(
    { transformers, ...esbuildConfig }: BundlerConfig,
) {
    return async (params: BundlerParams) => {
        const {
            entryPoints,
            facadeToEntrypoint,
        } = await writeEntrypoints(params);

        const result = await bundleWithEsbuild(
            entryPoints,
            transformers,
            params,
            esbuildConfig,
        );

        return await writeBundles(result, facadeToEntrypoint, params);
    };
}

async function writeEntrypoints(params: BundlerParams) {
    const facadeToEntrypoint: FacadeToEntrypoint = {};

    const entryPoints = await Promise.all(
        params.facades.map(async (facade, i) => {
            const facadeId = new murmur.Hash().update(facade.bundle).update(
                String(i),
            ).digest();

            const facadePath = path.join(
                params.cacheDir,
                'script_loader',
                `${facadeId}.ts`,
            );

            const key = path.relative(params.outputDir, facadePath);

            facadeToEntrypoint[key] = facadeToEntrypoint[key] ?? [];
            facadeToEntrypoint[key].push({
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

async function bundleWithEsbuild(
    entryPoints: string[],
    transformers: Transformer[] | undefined,
    params: BundlerParams,
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
        outdir: params.publicDir,
        entryNames: `js/${esbuildConfig.entryNames ?? '[dir]/[name]-[hash]'}`,
        chunkNames: `js/${esbuildConfig.chunkNames ?? '[dir]/[name]-[hash]'}`,
        assetNames: `js/${esbuildConfig.assetNames ?? '[dir]/[name]-[hash]'}`,
        plugins: [frugalPlugin({
            loader: 'portable',
            importMapURL: params.importMapURL,
            transformers: transformers,
        })],
    }) as BuildResult;
}

type FacadeToEntrypoint = Record<string, {
    entrypoint: string;
    bundle: string;
}[]>;

async function writeBundles(
    result: BuildResult,
    facadeToEntrypoint: FacadeToEntrypoint,
    params: BundlerParams,
) {
    const url: Record<string, Record<string, string>> = {};

    await Promise.all(result.outputFiles.map(async (outputFile) => {
        const relativeOutputPath = path.relative(Deno.cwd(), outputFile.path);
        const output = result.metafile.outputs[relativeOutputPath];

        // if the outputed file is an entry point
        if (output?.entryPoint) {
            const facades = facadeToEntrypoint[
                path.relative(params.outputDir, output.entryPoint)
            ];
            // if there is a matching facade, it means the entrypoint is a static
            // entrypoint (no dynamic import)
            if (facades !== undefined) {
                for (const { entrypoint, bundle } of facades) {
                    const entrypointKey = path.relative(
                        params.rootDir,
                        new URL(entrypoint).pathname,
                    );
                    url[entrypointKey] = url[entrypoint] ?? {};
                    url[entrypointKey][bundle] = `/${
                        path.relative(params.publicDir, outputFile.path)
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

    const metaPath = path.join(params.publicDir, 'js', 'meta.json');
    await fs.ensureFile(metaPath);
    await Deno.writeTextFile(
        metaPath,
        JSON.stringify(result.metafile, null, 2),
    );

    return url;
}
