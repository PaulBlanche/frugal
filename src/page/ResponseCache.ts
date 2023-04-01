import * as XX64 from '../../dep/xxhash.ts';
import * as path from '../../dep/std/path.ts';

import { Cache } from '../persistence/Cache.ts';
import { Persistence } from '../persistence/Persistence.ts';
import {
  DataResponse,
  FrugalResponse,
  SerializedFrugalResponse,
} from './FrugalResponse.ts';
import { log } from '../log.ts';
import { Config } from '../Config.ts';
import { BuildCache } from '../persistence/BuildCache.ts';
import { RuntimeCache } from '../persistence/RuntimeCache.ts';

export type CacheEntry = {
  name: string;
  hash: string;
  updatedAt: number;
  pathname: string;
  response: SerializedFrugalResponse;
};

export class ResponseCache {
  #cache: Cache<CacheEntry>;
  #persistence: Persistence;

  static async load(config: Config, mode: 'build' | 'runtime') {
    if (mode === 'build') {
      const cache = await BuildCache.load<CacheEntry>({
        hash: await config.hash,
        persistence: config.runtimePersistence,
      });

      return new ResponseCache(cache, config.runtimePersistence);
    } else {
      const cache = new RuntimeCache<CacheEntry>({
        hash: await config.hash,
        persistence: config.runtimePersistence,
      });

      return new ResponseCache(cache, config.runtimePersistence);
    }
  }

  constructor(
    cache: Cache<CacheEntry>,
    persistence: Persistence,
  ) {
    this.#cache = cache;
    this.#persistence = persistence;
  }

  async add<DATA>(
    pathname: string,
    name: string,
    moduleHash: string,
    response: DataResponse<DATA>,
  ) {
    const normalizedPathname = this.#normalizePathname(pathname);
    const responseHash = (await XX64.create())
      .update(JSON.stringify(response.data) ?? '')
      .update(normalizedPathname)
      .update(moduleHash)
      .digest('hex') as string;

    const result = await this.#cache.get(normalizedPathname);

    if (result?.name !== undefined && result.name !== name) {
      log(
        `routes "${result.name}" and "${name}" both matched the pathname "${pathname}'`,
        {
          kind: 'warning',
          scope: 'Router',
        },
      );
    }

    if (result?.hash !== responseHash) {
      log(`cache miss, render content for path "${pathname}"`, {
        scope: 'ResponseCache',
        kind: 'debug',
      });

      const frugalResponse = await response.render();

      await this.#cache.set(normalizedPathname, {
        hash: responseHash,
        name,
        pathname,
        updatedAt: Date.now(),
        response: frugalResponse.serialize(),
      });
    } else {
      log(
        `cache hit, skip render content for path "${pathname}"`,
        {
          scope: 'ResponseCache',
          kind: 'debug',
        },
      );

      this.#cache.propagate(normalizedPathname);
    }
  }

  async updatedAt(pathname: string): Promise<number | undefined> {
    const normalizedPathname = this.#normalizePathname(pathname);
    const data = await this.#persistence.get([
      this.#cache.hash,
      normalizedPathname,
    ]);
    if (data !== undefined) {
      return JSON.parse(data).updatedAt;
    }
  }

  async get(pathname: string): Promise<FrugalResponse | undefined> {
    const normalizedPathname = this.#normalizePathname(pathname);
    const data = await this.#persistence.get([
      this.#cache.hash,
      normalizedPathname,
    ]);
    if (data !== undefined) {
      const response = JSON.parse(data).response;
      try {
        return FrugalResponse.deserialize(response);
      } catch {
        return undefined;
      }
    }
  }

  async pathnames() {
    return (await this.#cache.values()).map((entry) => entry.pathname)
      .sort();
  }

  save() {
    return this.#cache.save();
  }

  #normalizePathname(pathname: string) {
    if (path.extname(pathname) === '') {
      return `./${pathname}/index`;
    }
    return `./${pathname}`;
  }
}
