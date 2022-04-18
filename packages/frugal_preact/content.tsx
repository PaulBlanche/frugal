/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import * as server from 'preact-render-to-string';
import { HeadProvider } from './Head.tsx';

import * as frugal from '../core/mod.ts';

import { DataProvider } from './dataContext.tsx';

export type PageProps = {
    entrypoint: string;
    loaderContext: frugal.LoaderContext;
};

export type Page = preact.ComponentType<PageProps>;

export type App = (
    props: AppProps,
) => preact.VNode;

export type AppProps = {
    entrypoint: string;
    loaderContext: frugal.LoaderContext;
    children: preact.ComponentChildren;
};

export type Document = preact.ComponentType<DocumentProps>;

export type DocumentProps = {
    head: preact.VNode[];
    entrypoint: string;
    loaderContext: frugal.LoaderContext;
    dangerouslySetInnerHTML: { __html: string };
};

type ContentConfig = {
    App: App;
    Document: Document;
    embedData: boolean;
};

const DEFAULT_APP: App = ({ children }) => {
    return <>{children}</>;
};

const DEFAULT_DOCUMENT: Document = (
    { head, dangerouslySetInnerHTML }: DocumentProps,
) => {
    const htmlIndex = head.findIndex((node) => node.type === 'html');

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

export function getContentFrom<REQUEST, DATA>(
    Page: Page,
    { App = DEFAULT_APP, Document = DEFAULT_DOCUMENT, embedData = true }:
        Partial<
            ContentConfig
        > = {},
): frugal.GetContent<REQUEST, DATA> {
    return ({
        data,
        pathname,
        entrypoint,
        loaderContext,
    }) => {
        let head: preact.VNode[] = [];

        const html = server.render(
            <HeadProvider
                onHeadUpdate={(nextHead) => {
                    head = nextHead;
                }}
            >
                <App
                    entrypoint={String(entrypoint)}
                    loaderContext={loaderContext}
                >
                    <DataProvider
                        embedData={embedData}
                        context={{ data, pathname, timestamp: Date.now() }}
                    >
                        <Page
                            entrypoint={String(entrypoint)}
                            loaderContext={loaderContext}
                        />
                    </DataProvider>
                </App>
            </HeadProvider>,
        );

        return `<!DOCTYPE html>${
            server.render(
                <Document
                    entrypoint={String(entrypoint)}
                    loaderContext={loaderContext}
                    head={head}
                    dangerouslySetInnerHTML={{ __html: html }}
                />,
            )
        }`;
    };
}
