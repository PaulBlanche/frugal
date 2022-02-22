import * as path from '../../dep/std/path.ts';
import * as fs from '../../dep/std/fs.ts';

import * as murmur from '../murmur/mod.ts';
import * as frugal from '../core/mod.ts';

type Config = {
    test: (url: URL) => boolean;
    transform?: (bundle: string) => string;
};

export function style(config: Config): frugal.Loader<string, string> {
    return {
        name: 'style',
        test: config.test,
        generate,
    };

    function generate({ assets, cache, dir }: frugal.GenerateParams) {
        const bundleHash = assets.reduce((hash, asset) => {
            return hash.update(asset.hash);
        }, new murmur.Hash()).alphabetic();

        return cache.memoize({
            key: bundleHash,
            producer: async () => {
                const styleModule = path.resolve(
                    path.dirname(new URL(import.meta.url).pathname),
                    './styled.ts',
                );

                const styleGeneratorScript = `
import { output } from "file://${styleModule}";
${
                    assets.map(({ module }) =>
                        `import "file://${module}";`
                    ).join('\n')
                }
export const result = output()`;

                const code = await import(
                    URL.createObjectURL(new Blob([styleGeneratorScript]))
                );
                const bundle = config.transform ? config.transform(code) : code;

                const bundleHash = new murmur.Hash()
                    .update(bundle)
                    .alphabetic();

                const bundleName = `style-${bundleHash}`;
                const bundleUrl = `/style/${bundleName}.css`;
                const bundlePath = path.join(dir.public, bundleUrl);

                await fs.ensureDir(path.dirname(bundlePath));
                await Deno.writeTextFile(bundlePath, bundle);

                return bundleUrl;
            },
        });
    }
}
