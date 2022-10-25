import { Config } from '../Config.ts';
import { FrugalBuilder } from '../FrugalBuilder.ts';
import * as path from '../../../dep/std/path.ts';
import * as fs from '../../../dep/std/fs.ts';

/**
 * Wrap a FrugalBuilder in a watcher instance. Internally, this class will spawn
 * a child deno process in watch mode actually running the FrugalBuilder and the
 * produced instance.
 */
export class FrugalWatcher {
    #builder: FrugalBuilder;

    constructor(builder: FrugalBuilder) {
        this.#builder = builder;
        this.#builder._watch = true;
    }

    /**
     * start the watch process. By default all modules in the dependency graph
     * are watched (see
     * https://deno.land/manual/getting_started/command_line_interface#watch-mode).
     * If you want to watch additionnal files/folders, pass them to the `paths`
     * option.
     */
    async watch(paths: string[] = []) {
        const config = await this.#builder._getCleanConfig();
        const code =
            `const { config } = await import('file://${config.self.pathname}')
const { FrugalWatcher, FrugalBuilder } = await import('file://${
                new URL('../mod.ts', import.meta.url).pathname
            }')

const frugal = await new FrugalBuilder(config).create();
await frugal.build();`;

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

/**
 * Convenience function building a FrugalBuilder, a FrugalWatcher, and starting
 * the watch process. By default all modules in the dependency graph are watched
 * (see
 * https://deno.land/manual/getting_started/command_line_interface#watch-mode).
 * If you want to watch additionnal files/folders, pass them to the `paths`
 * option.
 */
export async function watch(config: Config, watch: string[]) {
    const builder = new FrugalBuilder(config);
    const watcher = new FrugalWatcher(builder);
    await watcher.watch(watch);
}
