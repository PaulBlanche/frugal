import * as path from '../../dep/std/path.ts';
import * as fs from '../../dep/std/fs.ts';
import * as rollup from '../../dep/rollup.ts';
import { denoResolver } from '../../dep/rollup-plugin-deno-resolver.ts';
import * as murmur from '../murmur/mod.ts';
import * as frugal from '../core/mod.ts';
import * as log from '../log/mod.ts';

function logger() {
    return log.getLogger('frugal:loader:script');
}

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
