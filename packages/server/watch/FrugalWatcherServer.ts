import * as path from '../../../dep/std/path.ts';
import * as fs from '../../../dep/std/fs.ts';

import { WatchChild } from '../../core/watch/WatchChild.ts';

import { FrugalServerBuilder } from '../FrugalServerBuilder.ts';
import { LiveReloadServer } from './LivreReloadServer.ts';
import { Config } from '../Config.ts';

/**
 * Convenience function building a FrugalServerBuilder, a FrugalWatcherServer,
 * and starting the watch process.
 *
 * On each application reload, an event will be dispatched to a
 * LiveReloadClient, triggering a browser refresh.
 *
 * By default all modules in the dependency graph are watched (see
 * https://deno.land/manual/getting_started/command_line_interface#watch-mode).
 * If you want to watch additionnal files/folders, pass them to the `watch`
 * option.
 */
export async function watch(config: Config, watch: string[]) {
    const builder = new FrugalServerBuilder(config);
    const watcher = new FrugalWatcherServer(builder);
    await watcher.watch(watch);
}

/**
 * Wrap a FrugalServerBuilder in a watcher instance. Internally, this class will
 * spawn a child deno process in watch mode actually running the
 * FrugalServerBuilder and the produced instance. On each application reload, an
 * event will be dispatched to a LiveReloadClient, triggering a browser refresh.
 */
export class FrugalWatcherServer {
    #builder: FrugalServerBuilder;

    constructor(builder: FrugalServerBuilder) {
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
    async watch(paths: string[]) {
        const config = await this.#builder._getCleanConfig();
        const code =
            `const { config } = await import('file://${config.self.pathname}')
const { WatchService } = await import('file://${
                new URL('../../core/watch/WatchService.ts', import.meta.url)
                    .pathname
            }')
const { FrugalServerBuilder } = await import('file://${
                new URL('../mod.ts', import.meta.url).pathname
            }')

const service = new WatchService()

const builder = new FrugalServerBuilder({
    ...config, 
    server: {
        ...config.server,
        listen: {
            ...config.listen,
            onListen: (params) => {
                if(config.server.listen.onListen) {
                    config.server.listen.onListen(params)
                }
                service.sendMessage({ type: 'restart' })
            }
        }
    }
})
builder._watch = true;
const server = await builder.create();

addEventListener("unload", () => {
    service.sendMessage({ type: 'stop' })
})

server.listen();`;

        const filePath = path.join(config.cacheDir, 'watchServer.ts');

        await fs.ensureFile(filePath);
        await Deno.writeTextFile(filePath, code);

        const liveReloadServer = new LiveReloadServer();

        const child = new WatchChild(Deno.execPath(), {
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

        child.addEventListener('log', (event) => {
            console.log(...event.data);
        });

        child.addEventListener('message', (event) => {
            if (event.message.type === 'restart') {
                liveReloadServer.reload();
            }
            if (event.message.type === 'stop') {
                liveReloadServer.suspend();
            }
        });

        await Promise.all([liveReloadServer.listen(), child.start()]);
    }
}
