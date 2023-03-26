import * as esbuild from '../../dep/esbuild.ts';
import * as path from '../../dep/std/path.ts';

import * as deno from './deno.ts';
import * as shared from './shared.ts';

export class NativeLoader implements shared.Loader {
    #infoCache: deno.InfoCache;

    constructor(options: shared.LoaderOptions) {
        this.#infoCache = new deno.InfoCache({
            importMap: options.importMapURL?.href,
        });
    }

    async resolve(specifier: URL): Promise<shared.LoaderResolution> {
        const entry = await this.#infoCache.get(specifier.href);
        if ('error' in entry) {
            throw new Error(entry.error);
        }

        if (entry.kind === 'npm') {
            // TODO(lucacasonato): remove parsing once https://github.com/denoland/deno/issues/18043 is resolved
            const parsed = shared.parseNpmSpecifier(new URL(entry.specifier));
            return {
                kind: 'npm',
                packageName: parsed.name,
                path: parsed.path ?? '',
            };
        } else if (entry.kind === 'node') {
            return {
                kind: 'node',
                path: entry.specifier,
            };
        }

        return {
            kind: 'esm',
            specifier: new URL(entry.specifier),
        };
    }

    async loadEsm(
        specifier: string,
    ): Promise<shared.Loaded> {
        const entry = await this.#infoCache.get(specifier);
        if ('error' in entry) throw new Error(entry.error);

        if (!('local' in entry)) {
            throw new Error('[unreachable] Not an ESM module.');
        }
        if (!entry.local) throw new Error('Module not downloaded yet.');
        const loader = shared.mediaTypeToLoader(entry.mediaType);

        const raw = await Deno.readFile(entry.local);
        const contents = shared.transformRawIntoContent(raw, entry.mediaType);

        const res: shared.Loaded = { contents, loader };
        if (specifier.startsWith('file://')) {
            res.watchFiles = [path.fromFileUrl(new URL(specifier))];
        }
        return res;
    }
}
