import * as fs from "../../dep/std/fs.ts";
import * as path from "../../dep/std/path.ts";

type CacheData = {
  [s: string]: any;
};

type MemoizeConfig<V> = {
  key: string;
  producer: () => Promise<V> | V;
  otherwise?: () => Promise<void> | void;
};

export class Cache<VALUE = unknown> {
  private previousData: CacheData;
  private nextData: CacheData;
  private namespace: string;

  static async load(cachePath: string) {
    try {
      const data = await Deno.readTextFile(cachePath);
      return Cache.unserialize(JSON.parse(data));
    } catch {
      return Cache.unserialize();
    }
  }

  static unserialize(data?: CacheData) {
    if (data === undefined) {
      return new Cache({});
    }
    return new Cache(data);
  }

  private constructor(
    previousData: CacheData,
    nextData: CacheData = {},
    namespace: string = "",
  ) {
    this.namespace = namespace, this.previousData = previousData;
    this.nextData = nextData;
  }

  private key(key: string) {
    return `${this.namespace}${key}`;
  }

  had(key: string) {
    return this.key(key) in this.previousData;
  }

  has(key: string) {
    return this.key(key) in this.nextData;
  }

  async memoize<V = VALUE>(
    { key, producer, otherwise }: MemoizeConfig<V>,
  ): Promise<V> {
    if (!this.has(key)) {
      if (!this.had(key)) {
        this.set<Promise<V>>(
          key,
          Promise.resolve(producer()).then((v) => {
            this.set<V>(key, v);
            return v;
          }),
        );
      } else {
        if (otherwise) {
          await otherwise();
        }
        this.propagate(key);
      }
    } else {
      if (otherwise) {
        await otherwise();
      }
    }

    return Promise.resolve(this.get<Promise<V> | V>(key)!);
  }

  get<V = VALUE>(key: string): V | undefined {
    if (this.has(key)) {
      return this.nextData[this.key(key)];
    }
    if (this.had(key)) {
      return this.previousData[this.key(key)];
    }
    return undefined;
  }

  set<V = VALUE>(key: string, value: V) {
    this.nextData[this.key(key)] = value;
  }

  propagate(key: string) {
    if (this.had(key) && !this.has(key)) {
      this.set(key, this.previousData[this.key(key)]);
    }
  }

  serialize(): CacheData {
    return this.nextData;
  }

  async save(cachePath: string): Promise<void> {
    await fs.ensureDir(path.dirname(cachePath));
    await Deno.writeTextFile(cachePath, JSON.stringify(this.serialize()));
  }

  getNamespace<T>(namespace: string) {
    return new Cache<T>(this.previousData, this.nextData, namespace);
  }
}
