/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as server from "preact-render-to-string";
import { HeadProvider } from "./Head.tsx";

import * as descriptor from "../../page/PageDescriptor.ts";
import {
  END_NO_DIFF_COMMENT,
  START_NO_DIFF_COMMENT,
} from "../client_session/render/constant.ts";

const EXTRA_COMMENT_REGEXP = new RegExp(
  `</!--(?:${END_NO_DIFF_COMMENT}|${START_NO_DIFF_COMMENT})-->`,
  "g",
);

import { DataProvider } from "./dataContext.tsx";

export type PageProps = {
  descriptor: string;
  assets: descriptor.Assets;
};

export type Page = preact.ComponentType<PageProps>;

export type DocumentProps = {
  head: preact.VNode[];
  descriptor: string;
  assets: descriptor.Assets;
  dangerouslySetInnerHTML: { __html: string };
};

export type Document = preact.ComponentType<DocumentProps>;

type ContentConfig = {
  Document: Document;
  embedData: boolean;
};

const DEFAULT_DOCUMENT: Document = (
  { head, dangerouslySetInnerHTML }: DocumentProps,
) => {
  const htmlIndex = head.findIndex((node) => node.type === "html");

  const htmlProps = {};

  if (htmlIndex !== -1) {
    const [html] = head.splice(htmlIndex, 1);
    Object.assign(htmlProps, html.props);
  }

  return (
    <html {...htmlProps}>
      <head>
        {head}
      </head>
      <body dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
    </html>
  );
};

export function getContentFrom<DATA = unknown, PATH extends string = string>(
  Page: Page,
  {
    Document = DEFAULT_DOCUMENT,
    embedData = true,
  }: Partial<ContentConfig> = {},
): descriptor.GetContent<DATA, PATH> {
  return ({
    data,
    pathname,
    descriptor,
    assets,
  }) => {
    let head: preact.VNode[] = [];

    const html = server.render(
      <HeadProvider
        onHeadUpdate={(nextHead) => {
          head = nextHead;
        }}
      >
        <DataProvider
          embedData={embedData}
          context={{ data, pathname }}
        >
          <Page
            descriptor={String(descriptor)}
            assets={assets}
          />
        </DataProvider>
      </HeadProvider>,
    );

    return `<!DOCTYPE html>${
      server.render(
        <Document
          descriptor={String(descriptor)}
          assets={assets}
          head={head}
          dangerouslySetInnerHTML={{ __html: html }}
        />,
      ).replaceAll(EXTRA_COMMENT_REGEXP, "")
    }`;
  };
}
