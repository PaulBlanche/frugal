import * as descriptor from '../../page/PageDescriptor.ts';

export type PageProps = {
  descriptor: string;
  assets: descriptor.Assets;
};

export type RenderOptions = {
  // deno-lint-ignore no-explicit-any
  context: Map<string | number | symbol, any>;
};

export type RenderResult = {
  html: string;
  head: string;
};

export type ServerComponent = {
  render: (props: PageProps, options?: RenderOptions) => RenderResult;
};
