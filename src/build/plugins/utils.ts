import * as bytes from '../../../dep/std/fmt/bytes.ts';
import * as esbuild from '../../../dep/esbuild.ts';
import * as path from '../../../dep/std/path.ts';

import { Config } from '../../Config.ts';
import { log } from '../../log.ts';

export function getBundleSize(metafile: esbuild.Metafile, outputPath: string) {
    const outputs = metafile.outputs;
    const queue = [outputPath];
    let current: string | undefined;
    let size = 0;
    while ((current = queue.pop()) !== undefined) {
        const output = outputs[current];
        size += output.bytes;
        for (const imported of output.imports) {
            if (!imported.external && imported.kind !== 'dynamic-import') {
                queue.push(imported.path);
            }
        }
    }

    return size;
}

export function logBundleSize(
    bundleSize: number,
    config: Config,
    bundleName: string,
    bundleLimit: number,
    scope: string,
) {
    const message = `Output bundle "${bundleName}" (${bytes.format(bundleSize)})`;

    if (bundleSize > bundleLimit) {
        const extra = `Bundle size is over budget (${bytes.format(bundleLimit)})`;

        if (config.budget.log === 'error') {
            const error = new Error(extra);
            log(message, { scope, extra: String(error) });
            throw error;
        }

        log(message, { scope, extra, kind: 'warning' });
    } else {
        log(message, { scope, kind: 'debug' });
    }
}

export function name(specifier: string, config: Config) {
    const url = new URL(specifier);

    return url.protocol === 'file:' ? config.relative(specifier) : url.href;
}
