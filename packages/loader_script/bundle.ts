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
        rootDir: string;
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
        rootDir,
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
        ).alphabetic();

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
        outdir: path.join(publicDir, 'js'),
        plugins: [frugalPlugin({
            loader: 'portable',
            importMapFile,
            transformers,
        })],
    });

    console.log(result.metafile);

    await Promise.all(result.outputFiles.map(async (outputFile) => {
        const output = result.metafile
            ?.outputs[path.relative(Deno.cwd(), outputFile.path)];

        // if the outputed file is an entry point
        if (output?.entryPoint) {
            const facades = facadeToEntrypoint[output.entryPoint];
            // if there is a matching facade (so if the outputed file is not a dynamic entrypoint)
            if (facades !== undefined) {
                for (const { entrypoint, bundle } of facades) {
                    url[entrypoint] = url[entrypoint] ?? {};
                    url[entrypoint][bundle] = `/${
                        path.relative(publicDir, outputFile.path)
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

    return url;
}

/*
type BundleConfig = {
    cache: frugal.PersistantCache<any>;
    input?: Omit<rollup.InputOptions, 'input' | 'cache'>;
    outputs?: rollup.OutputOptions[];
    inline?: boolean;
    publicDir: string;
    scripts: {
        entrypoint: string;
        content: string;
    }[];
};

export function bundle(config: BundleConfig) {
    if (config.inline) {
        return bundleInline(config);
    }

    return bundleCodeSplit(config);
}


export function INLINE_CACHE_KEY(entrypoint: string) {
    return `rollup-inline-${entrypoint}`;
}

export const CODE_SPLIT_CACHE_KEY = `rollup-code-split`;

const SOURCEMAPPING_URL = 'sourceMa' + 'ppingURL';

export async function bundleInline(
    { cache, input, scripts, outputs = [] }: BundleConfig,
): Promise<Record<string, Record<string, string>>> {
    const bundles: Record<string, Record<string, string>> = {};

    await Promise.all(scripts.map(async (script) => {
        const cacheKey = INLINE_CACHE_KEY(script.entrypoint);
        const rollupCache = cache.get(cacheKey);

        const rollupBundle = await rollup.rollup({
            ...input,
            cache: rollupCache,
            plugins: [
                single(script.entrypoint, script.content),
                ...(input?.plugins ?? []),
                denoResolver() as rollup.Plugin,
            ],
            input: script.entrypoint,
        });

        cache.set(cacheKey, rollupBundle.cache);

        await Promise.all(outputs.map(async (outputConfig) => {
            const { output } = await rollupBundle.generate(outputConfig);

            const bundle = output[0].code;

            const format = outputConfig.format ?? 'es';

            bundles[script.entrypoint] = bundles[script.entrypoint] ?? {};
            bundles[script.entrypoint][format] = bundle;

            logger().debug({
                entrypoint: script.entrypoint,
                format: outputConfig.format,
                msg() {
                    return `add inline script ${this.entrypoint} (${this.format} format)`;
                },
            });
        }));

        await rollupBundle.close();
    }));

    return bundles;
}

export async function bundleCodeSplit(
    { cache, input, scripts, outputs = [], publicDir }: BundleConfig,
): Promise<Record<string, Record<string, string>>> {
    const urls: Record<string, Record<string, string>> = {};

    const rollupCache = cache.get(CODE_SPLIT_CACHE_KEY);

    const rollupBundle = await rollup.rollup({
        ...input,
        cache: rollupCache,
        plugins: [
            multiple(scripts),
            ...(input?.plugins ?? []),
            denoResolver() as rollup.Plugin,
        ],
        input: scripts.map((script) => script.entrypoint),
    });

    cache.set(CODE_SPLIT_CACHE_KEY, rollupBundle.cache);

    await Promise.all(outputs.map(async (outputConfig) => {
        const { output } = await rollupBundle.generate(outputConfig);

        await Promise.all(output.map(async (chunkOrAsset) => {
            if (chunkOrAsset.type === 'asset') {
                return;
            }

            const bundle = chunkOrAsset.code;
            const hash = new murmur.Hash().update(bundle).alphabetic();

            const ext = path.extname(chunkOrAsset.fileName);
            const name = path.basename(chunkOrAsset.fileName, ext);
            const fileName = chunkOrAsset.isEntry
                ? `${name}-${hash}${ext}`
                : chunkOrAsset.fileName;

            const format = outputConfig.format ?? 'es';

            const chunkUrl = `/js/${format}/${fileName}`;
            const chunkPath = path.join(publicDir, chunkUrl);

            if (outputConfig.sourcemap && chunkOrAsset.map) {
                if (outputConfig.sourcemap === 'inline') {
                    const sourceMapUrl = chunkOrAsset.map.toUrl();
                    const code = bundle +
                        `//# ${SOURCEMAPPING_URL}=${sourceMapUrl}\n`;

                    await fs.ensureDir(path.dirname(chunkPath));
                    await Deno.writeTextFile(chunkPath, code);
                } else {
                    const sourceMapPath = `${chunkPath}.map`;
                    const sourceMapUrl = `${path.basename(sourceMapPath)}`;

                    let code = bundle;
                    if (outputConfig.sourcemap !== 'hidden') {
                        code += `//# ${SOURCEMAPPING_URL}=${sourceMapUrl}\n`;
                    }

                    await fs.ensureDir(path.dirname(chunkPath));

                    await Promise.all([
                        Deno.writeTextFile(chunkPath, code),
                        Deno.writeTextFile(
                            sourceMapPath,
                            chunkOrAsset.map.toString(),
                        ),
                    ]);
                }
            } else {
                await fs.ensureDir(path.dirname(chunkPath));
                await Deno.writeTextFile(chunkPath, bundle);
            }

            if (chunkOrAsset.isEntry && chunkOrAsset.facadeModuleId !== null) {
                urls[chunkOrAsset.facadeModuleId] =
                    urls[chunkOrAsset.facadeModuleId] ??
                        {};
                urls[chunkOrAsset.facadeModuleId][format] = chunkUrl;

                logger().debug({
                    url: chunkUrl,
                    format: format,
                    page: chunkOrAsset.facadeModuleId,
                    msg() {
                        return `add bundle script ${this.url} for ${this.page} (${this.format} format)`;
                    },
                });
            }
        }));
    }));

    return urls;
}

function single(entrypoint: string, content: string): rollup.Plugin {
    return {
        name: 'frugal-bundle-single',
        resolveId(id) {
            if (id === entrypoint) {
                return entrypoint;
            }
            return null;
        },
        load(id) {
            if (id === entrypoint) {
                return content;
            }
            return null;
        },
    };
}

function multiple(
    scripts: { entrypoint: string; content: string }[],
): rollup.Plugin {
    return {
        name: 'frugal-bundle-single',
        resolveId(id) {
            const script = scripts.find((entry) => entry.entrypoint === id);
            if (script !== undefined) {
                return id;
            }
            return null;
        },
        load(id) {
            const script = scripts.find((entry) => entry.entrypoint === id);
            if (script !== undefined) {
                return script.content;
            }
            return null;
        },
    };
}
*/
