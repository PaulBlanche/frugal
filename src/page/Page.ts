import * as pathToRegexp from '../../dep/path-to-regexp.ts';

import * as descriptor from './PageDescriptor.ts';
import { FrugalError } from '../FrugalError.ts';
import { PathObject } from './PathObject.ts';
import { DataResponse } from './FrugalResponse.ts';

class BasePage<
  DATA = unknown,
  PATH extends string = string,
  DESCRIPTOR extends descriptor.PageDescriptor<DATA, PATH> =
    descriptor.PageDescriptor<
      DATA,
      PATH
    >,
> {
  #descriptor: DESCRIPTOR;
  #urlCompiler: pathToRegexp.PathFunction<PathObject<PATH>>;
  #urlMatcher: pathToRegexp.MatchFunction<PathObject<PATH>>;

  constructor(
    descriptor: DESCRIPTOR,
  ) {
    this.#descriptor = descriptor;
    this.#urlCompiler = pathToRegexp.compile(this.#descriptor.pattern);
    this.#urlMatcher = pathToRegexp.match(this.#descriptor.pattern);
  }

  get pattern() {
    return this.#descriptor.pattern;
  }

  get self() {
    return new URL(this.#descriptor.self);
  }

  get POST() {
    return this.#descriptor.POST;
  }

  get PUT() {
    return this.#descriptor.PUT;
  }

  get PATCH() {
    return this.#descriptor.PATCH;
  }

  get DELETE() {
    return this.#descriptor.DELETE;
  }

  getContent(context: descriptor.GetContentContext<DATA, PATH>) {
    return this.#descriptor.getContent(context);
  }

  compile(path: PathObject<PATH>) {
    try {
      return this.#urlCompiler(path);
    } catch (error: unknown) {
      throw new PageDescriptorError(
        `Error while compiling pattern "${this.pattern}" with path "${
          JSON.stringify(path)
        }"`,
        { page: this, cause: error },
      );
    }
  }

  match(path: string) {
    return this.#urlMatcher(path);
  }
}

export class DynamicPage<
  DATA = unknown,
  PATH extends string = string,
  DESCRIPTOR extends descriptor.DynamicPageDescriptor<DATA, PATH> =
    descriptor.DynamicPageDescriptor<DATA, PATH>,
> extends BasePage<DATA, PATH, DESCRIPTOR> {
  #descriptor: DESCRIPTOR;

  constructor(descriptor: DESCRIPTOR) {
    super(descriptor);
    this.#descriptor = descriptor;
  }

  GET(context: descriptor.DynamicDataContext<PATH>) {
    if (this.#descriptor.GET === undefined) {
      return new DataResponse({} as DATA);
    }

    return this.#descriptor.GET(context);
  }
}

export class StaticPage<
  DATA = unknown,
  PATH extends string = string,
  DESCRIPTOR extends descriptor.StaticPageDescriptor<DATA, PATH> =
    descriptor.StaticPageDescriptor<
      DATA,
      PATH
    >,
> extends BasePage<DATA, PATH, DESCRIPTOR> {
  #descriptor: descriptor.StaticPageDescriptor<DATA, PATH>;

  constructor(
    descriptor: DESCRIPTOR,
  ) {
    super(descriptor);
    this.#descriptor = descriptor;
  }

  GET(context: descriptor.StaticDataContext<PATH>) {
    if (this.#descriptor.GET === undefined) {
      return new DataResponse({} as DATA);
    }
    return this.#descriptor.GET(context);
  }

  getPathList(params: descriptor.GetPathListParams) {
    if (this.#descriptor.getPathList === undefined) {
      return [{}] as descriptor.PathList<PATH>;
    }
    return this.#descriptor.getPathList(params);
  }
}

export class PageDescriptorError extends FrugalError {
  // deno-lint-ignore no-explicit-any
  page: BasePage<any, any, any>;

  constructor(
    message: string,
    // deno-lint-ignore no-explicit-any
    options: ErrorOptions & { page: BasePage<any, any, any> },
  ) {
    super(message, options);
    this.page = options.page;
  }
}

export type Page<
  DATA = unknown,
  PATH extends string = string,
> =
  | StaticPage<DATA, PATH>
  | DynamicPage<DATA, PATH>;

/**
 * Build a page object from a page descriptor
 */
export function compile<
  DATA = unknown,
  PATH extends string = string,
>(name: string, pageDescriptor: descriptor.PageDescriptor<DATA, PATH>): Page {
  if (
    typeof pageDescriptor === 'object' &&
    pageDescriptor !== null &&
    'type' in pageDescriptor && pageDescriptor.type === 'dynamic'
  ) {
    const result = descriptor.parseDynamicDescriptor<DATA, PATH>(
      pageDescriptor,
    );
    if (result.success) {
      return new DynamicPage<DATA, PATH>(
        pageDescriptor,
      ) as Page;
    } else {
      throw new FrugalError(
        `Error while parsing descriptor "${name}" : ${result.error}`,
      );
    }
  }

  const result = descriptor.parseStaticDescriptor<DATA, PATH>(pageDescriptor);
  if (result.success) {
    return new StaticPage<DATA, PATH>(
      // deno-lint-ignore no-explicit-any
      pageDescriptor as any,
    ) as Page;
  } else {
    throw new FrugalError(
      `Error while parsing descriptor "${name}" : ${result.error}`,
    );
  }
}
