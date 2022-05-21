import * as path from '../../dep/std/path.ts';
import * as fs from '../../dep/std/fs.ts';
import * as murmur from '../murmur/mod.ts';
import * as log from '../log/mod.ts';

import * as esbuild from '../../dep/esbuild.ts';
import { frugalPlugin, Transformer } from './frugalPlugin.ts';

function logger() {
    return log.getLogger('frugal:loader:script');
}

export function bundle(config: BundleConfig) {
    return bundleCodeSplit(config);
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

export type BundleConfig =
    & {
        cacheDir: string;
        publicDir: string;
        facades: {
            bundle: string;
            entrypoint: string;
            content: string;
        }[];
        transformers?: Transformer[];
        importMapFile?: string;
    }
    & EsbuildConfig;

async function bundleCodeSplit(
    {
        cacheDir,
        publicDir,
        facades,
        transformers,
        importMapFile,
        ...esbuildConfig
    }: BundleConfig,
) {
    const url: Record<string, Record<string, string>> = {};

    const facadeToEntrypoint: Record<
        string,
        { entrypoint: string; bundle: string }[]
    > = {};

    const entryPoints = await Promise.all(facades.map(async (facade) => {
        const facadeId = new murmur.Hash().update(
            facade.content,
        ).digest();

        const facadePath = path.join(
            cacheDir,
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
    }));

    const result = await esbuild.build({
        ...esbuildConfig,
        entryPoints,
        bundle: true,
        write: false,
        metafile: true,
        platform: 'neutral',
        incremental: false,
        outdir: publicDir,
        entryNames: `js/${esbuildConfig.entryNames ?? '[dir]/[name]-[hash]'}`,
        chunkNames: `js/${esbuildConfig.chunkNames ?? '[dir]/[name]-[hash]'}`,
        assetNames: `js/${esbuildConfig.assetNames ?? '[dir]/[name]-[hash]'}`,
        plugins: [frugalPlugin({
            loader: 'portable',
            importMapFile,
            transformers,
        })],
    });

    await Promise.all(result.outputFiles.map(async (outputFile) => {
        const output = result.metafile
            ?.outputs[path.relative(Deno.cwd(), outputFile.path)];

        // if the outputed file is an entry point
        if (output?.entryPoint) {
            const facades = facadeToEntrypoint[output.entryPoint];
            // if there is a matching facade (so if the outputed file is not a dynamic entrypoint)
            if (facades !== undefined) {
                const bundleName = facades[0].bundle;
                const bundleHash = new murmur.Hash().update(outputFile.text)
                    .digest();
                const bundleExt = path.extname(outputFile.path);
                const outputPath = path.resolve(
                    path.dirname(outputFile.path),
                    `${bundleName}-${bundleHash.toUpperCase()}${bundleExt}`,
                );

                outputFile.path = outputPath;

                for (const { entrypoint, bundle } of facades) {
                    url[entrypoint] = url[entrypoint] ?? {};
                    url[entrypoint][bundle] = `/${
                        path.relative(publicDir, outputPath)
                    }`;

                    logger().debug({
                        url: url[entrypoint][bundle],
                        bundle,
                        page: entrypoint,
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

    //TODO(@PaulBlanche): also output metafile ?

    return url;
}
