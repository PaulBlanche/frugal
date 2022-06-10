import { Config } from '../Config.ts';
import { FrugalBuilder } from '../Frugal.ts';
import * as path from '../../../dep/std/path.ts';
import * as fs from '../../../dep/std/fs.ts';

export class FrugalWatcher {
    #builder: FrugalBuilder;

    constructor(builder: FrugalBuilder) {
        this.#builder = builder;
        this.#builder._watch = true;
    }

    create() {
        return this.#builder.create();
    }

    async watch(paths: string[]) {
        const config = await this.#builder._getCleanConfig();
        const code =
            `const { config } = await import('file://${config.self.pathname}')
        const { FrugalWatcher, FrugalBuilder } = await import('file://${
                new URL('mod.ts', import.meta.url).pathname
            }')

        const frugal = await new FrugalBuilder(config).create();
        await frugal.build();
        `;

        const filePath = path.join(config.cacheDir, 'watch.ts');

        await fs.ensureFile(filePath);
        await Deno.writeTextFile(filePath, code);

        const child = Deno.spawnChild(Deno.execPath(), {
            args: [
                'run',
                '--unstable',
                paths.length === 0 ? '--watch' : `--watch=${paths.join(',')}`,
                '--no-check',
                '--allow-all',
                filePath,
            ],
            cwd: path.dirname(config.self.pathname),
        });

        child.stdout.pipeTo(Deno.stdout.writable);
        child.stderr.pipeTo(Deno.stderr.writable);

        await child.status;
    }
}

export async function watch(config: Config, watch: string[]) {
    const builder = new FrugalBuilder(config);
    const watcher = new FrugalWatcher(builder);
    await watcher.watch(watch);
}
