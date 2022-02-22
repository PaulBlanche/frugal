import { Cache } from './Cache.ts';
import * as mumur from '../murmur/mod.ts';
import * as path from '../../dep/std/path.ts';
import * as fs from '../../dep/std/fs.ts';
import { assert } from '../assert/mod.ts';
import { Context } from './loader.ts';
import * as log from '../log/mod.ts';

export type GetRequestList<REQUEST> = () => Promise<REQUEST[]>;

export type GetDataParams<REQUEST> = {
    request: REQUEST;
    cache: Cache;
};

export type GetData<REQUEST, DATA> = (
    params: GetDataParams<REQUEST>,
) => Promise<DATA> | DATA;

export type GetUrlParams<REQUEST, DATA> = {
    request: REQUEST;
    data: DATA;
    cache: Cache;
};

export type GetUrl<REQUEST, DATA> = (
    params: GetUrlParams<REQUEST, DATA>,
) => string;

export type GetContentParams<REQUEST, DATA> = {
    request: REQUEST;
    data: DATA;
    url: string;
    path: string;
    context: Context;
    cache: Cache;
};

export type GetContent<REQUEST, DATA> = (
    params: GetContentParams<REQUEST, DATA>,
) => Promise<string> | string;

export type PageDescriptor<REQUEST, DATA> = {
    getRequestList: GetRequestList<REQUEST>;
    getData: GetData<REQUEST, DATA>;
    getUrl: GetUrl<REQUEST, DATA>;
    getContent: GetContent<REQUEST, DATA>;
};

export class Page<REQUEST, DATA> {
    private descriptor: PageDescriptor<REQUEST, DATA>;
    private moduleHash: string;
    private path: string;

    static async load<REQUEST, DATA>(
        entrypoint: { url: URL; moduleHash: string },
    ): Promise<Page<REQUEST, DATA>> {
        logger().info({
            op: 'loading',
            url: entrypoint.url.toString(),
            msg() {
                return `${this.op} ${this.url}`;
            },
        });
        const pageDescriptor = await import(entrypoint.url.toString());
        return new Page(
            entrypoint.url.toString(),
            pageDescriptor,
            entrypoint.moduleHash,
        );
    }

    private constructor(
        path: string,
        descriptor: PageDescriptor<REQUEST, DATA>,
        moduleHash: string,
    ) {
        this.descriptor = descriptor;
        this.moduleHash = moduleHash;
        this.path = path;
        this.validateDescriptor(path);
    }

    async generate(
        cache: Cache,
        context: Context,
        publicDir: string,
    ): Promise<void> {
        logger().info({
            op: 'start',
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: `page generation ${this.path}`,
            },
        });

        const requestsList = await this.descriptor.getRequestList();

        const instancePromise = [];

        for (const request of requestsList) {
            instancePromise.push(
                this.generateInstance(request, cache, context, publicDir),
            );
        }

        await Promise.all(instancePromise);

        logger().info({
            op: 'done',
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: `page generation ${this.path}`,
            },
        });
    }

    private async generateInstance(
        request: REQUEST,
        cache: Cache,
        context: Context,
        publicDir: string,
    ): Promise<void> {
        const data = await this.descriptor.getData({ request, cache });

        const pageInstanceHash = new mumur.Hash()
            .update(JSON.stringify(data))
            .update(this.moduleHash)
            .alphabetic();

        await cache.memoize({
            key: pageInstanceHash,
            producer: async () => {
                const url = this.descriptor.getUrl({ request, data, cache });

                const content = await this.descriptor.getContent({
                    request,
                    data,
                    url,
                    path: this.path,
                    context,
                    cache,
                });

                const pagePath = path.join(publicDir, url);
                await fs.ensureDir(path.dirname(pagePath));

                await Deno.writeTextFile(pagePath, content);
            },
        });
    }

    private validateDescriptor(path: string): void {
        assert(
            typeof this.descriptor.getRequestList === 'function',
            `Page descriptor "${path}" has no getRequestList function`,
        );
        assert(
            typeof this.descriptor.getData === 'function',
            `Page descriptor "${path}" has no getData function`,
        );
        assert(
            typeof this.descriptor.getUrl === 'function',
            `Page descriptor "${path}" has no getUrl function`,
        );
        assert(
            typeof this.descriptor.getContent === 'function',
            `Page descriptor "${path}" has no getContent function`,
        );
    }
}

function logger() {
    return log.getLogger('frugal:page');
}
