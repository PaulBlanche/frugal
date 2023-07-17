declare global {
  interface FrugalGlobalNamespace {
    context?: {
      // deno-lint-ignore no-explicit-any
      data: any;
      pathname: string;
    };
  }

  namespace globalThis {
    // deno-lint-ignore no-var
    var __FRUGAL__: FrugalGlobalNamespace;
  }
}

export type HydrationStrategy =
  | 'load'
  | 'idle'
  | 'visible'
  | 'media-query'
  | 'never';

export type App<PROPS> = (props: PROPS) => preact.VNode;

export type GetApp<PROPS> = () => Promise<App<PROPS>> | App<PROPS>;
