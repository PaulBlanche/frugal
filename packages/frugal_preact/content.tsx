/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import * as server from 'preact-render-to-string';
import { HeadProvider } from './Head.tsx';

import * as frugal from '../core/mod.ts';

import { DataProvider } from './dataContext.tsx';

export type PageProps = {
    descriptor: string;
    loaderContext: frugal.LoaderContext;
};

export type Page = preact.ComponentType<PageProps>;

export type App = (
    props: AppProps,
) => preact.VNode;

export type AppProps = {
    descriptor: string;
    loaderContext: frugal.LoaderContext;
    children: preact.ComponentChildren;
};

export type Document = preact.ComponentType<DocumentProps>;

export type DocumentProps = {
    head: preact.VNode[];
    descriptor: string;
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

export function getContentFrom<PATH extends Record<string, string>, DATA>(
    Page: Page,
    { App = DEFAULT_APP, Document = DEFAULT_DOCUMENT, embedData = true }:
        Partial<
            ContentConfig
        > = {},
): frugal.GetContent<PATH, DATA> {
    return ({
        data,
        pathname,
        descriptor,
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
                    descriptor={String(descriptor)}
                    loaderContext={loaderContext}
                >
                    <DataProvider
                        embedData={embedData}
                        context={{ data, pathname }}
                    >
                        <Page
                            descriptor={String(descriptor)}
                            loaderContext={loaderContext}
                        />
                    </DataProvider>
                </App>
            </HeadProvider>,
        );

        return `<!DOCTYPE html>${
            server.render(
                <Document
                    descriptor={String(descriptor)}
                    loaderContext={loaderContext}
                    head={head}
                    dangerouslySetInnerHTML={{ __html: html }}
                />,
            )
        }`;
    };
}
