import * as path from '../../dep/std/path.ts';

import { Phase } from './PageDescriptor.ts';
import { DynamicPage, Page } from './Page.ts';
import { PageGenerator } from './PageGenerator.ts';
import { PathObject } from './PathObject.ts';
import { AssertionError } from '../FrugalError.ts';
import { ResponseCache } from './ResponseCache.ts';
import { log } from '../log.ts';

type PageBuilderConfig<DATA = unknown, PATH extends string = string> = {
  page: Page<DATA, PATH>;
  name: string;
  hash: string;
  generator: PageGenerator<DATA, PATH>;
  cache: ResponseCache;
  resolve: (specifier: string) => string;
};

/**
 * Class handling the page building process (offloading the actual generation to
 * PageGenerator)
 */
export class PageBuilder<DATA = unknown, PATH extends string = string> {
  #config: PageBuilderConfig<DATA, PATH>;

  constructor(config: PageBuilderConfig<DATA, PATH>) {
    this.#config = config;
  }

  /**
   * Build the page for all the path returned by `getPathList`.
   */
  async buildAll() {
    if (this.#config.page instanceof DynamicPage) {
      throw new AssertionError(
        `Can't statically build DynamicPage ${this.#config.page.pattern}`,
      );
    }

    const pathList = await this.#config.page.getPathList({
      phase: 'build',
      resolve: (specifier) => this.#config.resolve(specifier),
    });

    await Promise.all(pathList.map(async (path) => {
      await this.build(path, 'build');
    }));
  }

  /**
   * Build the page for a given path and return the output path.
   *
   * The build process id memoized and will be skiped if nothing has changed
   * since the last build.
   */
  async build(buildPath: PathObject<PATH>, phase: Phase): Promise<void> {
    if (this.#config.page instanceof DynamicPage) {
      throw new AssertionError(
        `Can't statically build DynamicPage ${this.#config.page.pattern}`,
      );
    }

    const pathname = this.#config.page.compile(buildPath);

    const response = await this.#config.page.GET({
      phase,
      path: buildPath,
      resolve: (specifier) => this.#config.resolve(specifier),
    });

    response.setRenderer((data) =>
      this.#config.generator.render(pathname, {
        data,
        path: buildPath,
        phase,
        method: 'GET',
      })
    );

    log(`building path "${pathname}"`, {
      scope: 'PageBuilder',
      kind: 'debug',
    });

    await this.#config.cache.add(
      pathname,
      this.#config.name,
      this.#config.hash,
      response,
    );
  }
}

export function metadataPath(pagePath: string) {
  return path.join(
    path.dirname(pagePath),
    path.basename(pagePath) + '.metadata',
  );
}
