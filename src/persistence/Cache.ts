import { Persistence } from './Persistence.ts';

export interface Cache<VALUE = unknown> {
  hash: string;
  get(key: string): Promise<VALUE | undefined>;
  set(key: string, value: VALUE): Promise<void>;
  propagate(key: string): void;
  save(): Promise<void>;
  values(): Promise<VALUE[]>;
}

export type CacheData<VALUE> = {
  [s: string]: VALUE;
};

export type CacheConfig = {
  hash: string;
  persistence: Persistence;
};

export type SerializedCache<VALUE> = {
  hash: string;
  data: CacheData<VALUE>;
};
