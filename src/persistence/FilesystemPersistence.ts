import * as fs from '../../dep/std/fs.ts';
import * as path from '../../dep/std/path.ts';

import { Persistence } from './Persistence.ts';

export class FilesystemPersistence implements Persistence {
  #root: URL;
  constructor(root: URL) {
    this.#root = root;
  }

  async set(key: string | [string, string], content: string) {
    const url = this.#url(key);
    await fs.ensureFile(url);
    return await Deno.writeTextFile(url, content);
  }

  async get(key: string | [string, string]) {
    try {
      return await Deno.readTextFile(this.#url(key));
    } catch (error: unknown) {
      if (error instanceof Deno.errors.NotFound) {
        return undefined;
      }
      throw error;
    }
  }

  async delete(key: string | [string, string]) {
    return await Deno.remove(this.#url(key));
  }

  #url(key: string | [string, string]) {
    if (Array.isArray(key)) {
      return new URL(path.join(...key), this.#root);
    }
    return new URL(key, this.#root);
  }
}
