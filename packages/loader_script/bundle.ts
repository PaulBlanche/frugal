import * as path from '../../dep/std/path.ts';
import * as fs from '../../dep/std/fs.ts';
import * as rollup from '../../dep/rollup.ts';
import { denoResolver } from '../../dep/rollup-plugin-deno-resolver.ts';
import * as murmur from '../murmur/mod.ts';
import * as frugal from '../core/mod.ts';

type BundleConfig = {
    cache: frugal.Cache<any>;
    input?: Omit<rollup.InputOptions, 'input' | 'cache'>;
    inline?: boolean;
    format: NonNullable<rollup.OutputOptions['format']>[];
    publicDir: string;
    scripts: {
        entrypoint: string;
        content: string;
    }[];
    transformChunk?: (
        code: string,
    ) => Promise<string> | string;
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

export async function bundleInline(
    { cache, input, scripts, format, transformChunk }: BundleConfig,
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

        await Promise.all(format.map(async (format) => {
            const { output } = await rollupBundle.generate({
                format,
            });

            const bundle = transformChunk
                ? await transformChunk(output[0].code)
                : output[0].code;

            bundles[script.entrypoint] = bundles[script.entrypoint] ?? {};
            bundles[script.entrypoint][format] = bundle;
        }));

        await rollupBundle.close();
    }));

    return bundles;
}

export async function bundleCodeSplit(
    { cache, input, scripts, format, transformChunk, publicDir }: BundleConfig,
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

    await Promise.all(format.map(async (format) => {
        const { output } = await rollupBundle.generate({
            format,
        });

        await Promise.all(output.map(async (chunkOrAsset) => {
            if (chunkOrAsset.type === 'asset') {
                return;
            }

            const bundle = transformChunk
                ? await transformChunk(chunkOrAsset.code)
                : chunkOrAsset.code;

            const hash = new murmur.Hash().update(bundle).alphabetic();

            const ext = path.extname(chunkOrAsset.fileName);
            const name = path.basename(chunkOrAsset.fileName, ext);
            const fileName = chunkOrAsset.isEntry
                ? `${name}-${hash}${ext}`
                : chunkOrAsset.fileName;

            const chunkUrl = `/js/${format}/${fileName}`;
            const chunkPath = path.join(publicDir, chunkUrl);

            await fs.ensureDir(path.dirname(chunkPath));
            await Deno.writeTextFile(chunkPath, bundle);

            if (chunkOrAsset.isEntry && chunkOrAsset.facadeModuleId !== null) {
                urls[chunkOrAsset.facadeModuleId] =
                    urls[chunkOrAsset.facadeModuleId] ??
                        {};
                urls[chunkOrAsset.facadeModuleId][format] = chunkUrl;
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
