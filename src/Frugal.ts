import * as esbuild from '../dep/esbuild.ts';
import * as path from '../dep/std/path.ts';

import { getPlugins } from './build/esbuild_plugin/getPlugins.ts';
import { Config, FrugalConfig } from './Config.ts';
import { log } from './log.ts';
import { WatchContext } from './watch/WatchContext.ts';
import { FrugalContext } from './watch/FrugalContext.ts';
import { Context } from './watch/Context.ts';
import { RoutablePage, Router } from './page/Router.ts';
import { FrugalServer, StaticFileServer } from './server/mod.ts';
import { ServeOptions } from './server/Server.ts';

export class Frugal {
    #config: Config;

    constructor(config: FrugalConfig) {
        this.#config = new Config(config);
    }

    get config() {
        return this.#config;
    }

    async devContext(isStatic?: boolean): Promise<Context> {
        await this.#config.validate();

        if (!this.#config.isDevMode) {
            return new FrugalContext(
                this.#config,
                () => this.#server('build', isStatic),
            );
        } else {
            const esbuildContext = await esbuild.context(
                this.#getEsbuildConfig(isStatic),
            );
            return new WatchContext(esbuildContext);
        }
    }

    async build() {
        await this.#config.validate();

        log('start frugal build', { scope: 'Frugal' });

        this.#config.budget.logBudget();

        try {
            await esbuild.build(this.#getEsbuildConfig());
        } finally {
            esbuild.stop();
        }
    }

    async serve(options?: ServeOptions) {
        await this.#config.validate();

        log('start frugal server', { scope: 'Frugal' });
        const server = await this.#server('runtime');
        server.serve(options);
    }

    async staticBuild() {
        await this.#config.validate();

        log('start frugal export', { scope: 'Frugal' });
        this.#config.budget.logBudget();

        try {
            await esbuild.build(this.#getEsbuildConfig(true));
        } finally {
            esbuild.stop();
        }
    }

    async #server(mode: 'build' | 'runtime', isStatic?: boolean) {
        const router = await this.#loadRouter(mode);
        return isStatic
            ? new StaticFileServer(this.#config)
            : new FrugalServer(this.#config, router);
    }

    #getEsbuildConfig(isStatic?: boolean): esbuild.BuildOptions {
        const plugins = getPlugins(this.#config, isStatic);

        const esbuildConfig: esbuild.BuildOptions = {
            ...this.#config.esbuildOptions,
            target: [],
            entryPoints: this.#config.pages.map((page) => path.fromFileUrl(page)),
            entryNames: '[dir]/[name]',
            chunkNames: '[dir]/[name]-[hash]',
            assetNames: '[dir]/[name]-[hash]',
            bundle: true,
            metafile: true,
            write: true,
            splitting: false,
            sourcemap: false,
            define: {
                ...this.#config.esbuildOptions?.define,
                'import.meta.main': 'false',
            },
            format: 'esm',
            outdir: path.fromFileUrl(this.#config.builddir),
            plugins,
            absWorkingDir: path.fromFileUrl(new URL('.', this.#config.self)),
            logLevel: 'silent',
        };

        log(`server esbuild config`, {
            kind: 'verbose',
            scope: 'Frugal',
            extra: JSON.stringify(esbuildConfig),
        });

        return esbuildConfig;
    }

    async #loadRouter(mode: 'build' | 'runtime') {
        const { pages, assets } = JSON.parse(
            await Deno.readTextFile(
                new URL('context.json', this.#config.runtimedir),
            ),
        );

        const routablePages: RoutablePage[] = [];
        for (const page of pages) {
            const pageUrl = new URL(page.name, this.#config.self);
            const matchingPage = this.#config.pages.find((page) => page.href === pageUrl.href);

            if (matchingPage) {
                routablePages.push({
                    name: page.name,
                    url: new URL(page.url),
                    hash: page.hash,
                });
            }
        }

        const responseCache = await this.#config.responseCache(mode);

        const router = new Router(this.#config, responseCache);
        await router.setup({ pages: routablePages, assets });

        return router;
    }
}

export async function build(config: FrugalConfig) {
    const frugal = new Frugal(config);
    await frugal.build();
    await frugal.config.buildPersistence.set('configHash', await frugal.config.hash);
    return frugal;
}

type DevOptions = {
    static?: boolean;
};

export async function dev(config: FrugalConfig, options: DevOptions = {}) {
    const frugal = new Frugal(config);
    const context = await frugal.devContext(options.static);
    return {
        frugal,
        start: () => context.dev(),
        stop: () => context.dispose(),
    };
}

export async function staticBuild(config: FrugalConfig) {
    const frugal = new Frugal(config);
    await frugal.staticBuild();
    return frugal;
}

export async function serve(config: FrugalConfig) {
    const frugal = new Frugal(config);
    const hash = await frugal.config.buildPersistence.get('configHash');
    frugal.config.setHash(hash);
    await frugal.serve();
}
