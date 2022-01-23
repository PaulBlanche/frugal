/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from "preact";
import * as server from "preact-render-to-string";
import { HeadProvider } from "./Head.tsx";

import * as frugal from "../core/mod.ts";

import { DataProvider } from "./dataContext.tsx";

export type PageProps = { context: frugal.Context }

export type Page = preact.ComponentType<PageProps>;

export function content<REQUEST, DATA>(
  Page: Page,
  App: App<DATA> = DefaultApp,
  Document: Document = DefaultDocument,
): frugal.GetContent<REQUEST, DATA> {
  return async ({
    data,
    url,
    context,
    cache,
  }) => {
    let head: preact.VNode[] = [];

    const syncApp = await App({
      cache,
      data,
      children: <HeadProvider onHeadUpdate={(nextHead) => { head = nextHead }}>
        <DataProvider context={{ data, url }}>
          <Page context={context} />
        </DataProvider>
      </HeadProvider>,
    });
    const html = server.render(<>{syncApp}</>);

    return `<!DOCTYPE html>${
      server.render(
        <Document
          head={head}
          html={html}
        />,
      )
    }`;
  };
}


type Document = preact.ComponentType<DocumentProps>;

export type DocumentProps = {
  head: preact.VNode[];
  html: string;
};


export function DefaultDocument({ head, html }: DocumentProps) {
  return (
    <html>
      <head>
        {head}
      </head>
      <body>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </body>
    </html>
  );
}

type App<DATA> = (
  props: AppProps<DATA>,
) => Promise<preact.VNode> | preact.VNode;

export type AppProps<DATA> = {
  data: DATA;
  cache?: frugal.Cache;
  children: preact.ComponentChildren;
};

export function DefaultApp<DATA>({ children }: AppProps<DATA>) {
  return <>{children}</>;
}

