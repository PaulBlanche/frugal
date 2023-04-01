import { DynamicDataContext, Phase } from './PageDescriptor.ts';
import { Page, StaticPage } from './Page.ts';
import { PathObject } from './PathObject.ts';
import { AssertionError, FrugalError } from '../FrugalError.ts';
import { DataResponse, FrugalResponse } from './FrugalResponse.ts';

type ContentGenerationContext<DATA = unknown, PATH extends string = string> = {
  method: string;
  data: DATA;
  path: PathObject<PATH>;
  phase: Phase;
};

export type PageGeneratorConfig<DATA = unknown, PATH extends string = string> =
  {
    page: Page<DATA, PATH>;
    // deno-lint-ignore no-explicit-any
    assets: Record<string, any>;
    descriptor: string;
    resolve: (specifier: string) => string;
    watch?: boolean;
  };
/**
 * Class handling the page generation process.
 */
export class PageGenerator<DATA = unknown, PATH extends string = string> {
  #config: PageGeneratorConfig<DATA, PATH>;

  constructor(config: PageGeneratorConfig<DATA, PATH>) {
    this.#config = config;
  }

  get layout() {
    return this.#config.assets;
  }

  /**
   * Generate the page given a request object.
   *
   * Will throw if the request pathname does not match the page pattern.
   */
  async generate(
    request: Request,
    state: Record<string, unknown>,
  ): Promise<FrugalResponse> {
    const pathname = new URL(request.url).pathname;
    const match = this.#config.page.match(pathname);

    if (match === false) {
      throw new AssertionError(
        `pathname "${pathname} did not match pattern "${this.#config.page.pattern}"`,
      );
    }

    const path = match.params;

    const response = await this.#getData({
      phase: 'generate',
      request,
      path,
      state,
      resolve: (specifier) => this.#config.resolve(specifier),
    });

    response.setRenderer((data) => {
      return this.render(pathname, {
        data,
        path,
        phase: 'generate',
        method: request.method,
      });
    });

    const frugalResponse = await response.render();

    return frugalResponse;
  }

  /**
   * Generate the content of a page form its data and path
   */
  async render(
    pathname: string,
    { data, path, phase, method }: ContentGenerationContext<DATA, PATH>,
  ): Promise<string> {
    const getContentContext = {
      method,
      phase,
      path,
      data,
      pathname,
      descriptor: this.#config.descriptor,
      assets: this.#config.assets,
    };

    return await this.#config.page.getContent(getContentContext);
  }

  async #getData(
    context: DynamicDataContext<PATH>,
  ): Promise<DataResponse<DATA>> {
    if (!(context.request.method in this.#config.page)) {
      throw new FrugalError(
        `Page ${this.#config.page.pattern} cannot handle ${context.request.method} requests`,
      );
    }

    if (this.#config.page instanceof StaticPage) {
      if (context.request.method === 'GET') {
        if (!this.#config.watch) {
          throw new FrugalError(
            `Can't dynamically generate StaticPage ${this.#config.page.pattern} for GET method`,
          );
        }
        return await this.#config.page.GET(context);
      }
    }

    // need to index this.#page with a string
    // deno-lint-ignore no-explicit-any
    return await (this.#config.page as any)[context.request.method](
      context,
    );
  }
}
