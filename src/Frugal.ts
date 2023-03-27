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
import { Assets } from './page/PageDescriptor.ts';
import { ServeOptions as BaseServeOptions } from './server/Server.ts';

type ServeOptions = BaseServeOptions & {
    routablePages: RoutablePage[];
    assets: Assets;
};
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
                async () => {
                    if (isStatic) {
                        new StaticFileServer(this.#config);
                    }

                    const responseCache = await this.#config.responseCache('build');
                    const { assets, routablePages } = await import(
                        new URL('_devserver.ts', this.#config.clidir).href
                    );

                    const router = new Router(this.#config, responseCache);
                    router.setup({ pages: routablePages, assets });

                    return new FrugalServer(this.#config, router);
                },
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

    async serve({ routablePages, assets, ...options }: ServeOptions) {
        await this.#config.validate();

        log('start frugal server', { scope: 'Frugal' });

        const responseCache = await this.#config.responseCache('runtime');
        const router = new Router(this.#config, responseCache);
        router.setup({
            pages: routablePages,
            assets,
        });

        const server = new FrugalServer(this.#config, router);
        await server.serve(options);
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
}

export async function build(config: FrugalConfig) {
    const frugal = new Frugal(config);
    await frugal.build();
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
