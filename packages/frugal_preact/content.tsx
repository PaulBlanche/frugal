/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import * as server from 'preact-render-to-string';
import { HeadProvider } from './Head.tsx';

import * as frugal from '../core/mod.ts';

import { DataProvider } from './dataContext.tsx';

export type PageProps = { 
    path: string,
    cache: frugal.Cache;
    context: frugal.Context 
};

export type Page = preact.ComponentType<PageProps>;


export type App = (
    props: AppProps,
) =>  preact.VNode;

export type AppProps = {
    path: string,
    context: frugal.Context
    children: preact.ComponentChildren;
    cache: frugal.Cache;
}

export type Document = preact.ComponentType<DocumentProps>;

export type DocumentProps = {
    head: preact.VNode[];
    path: string,
    context: frugal.Context
    dangerouslySetInnerHTML: { __html: string };
};

type ContentConfig = {
    App: App,
    Document: Document
}

const CONTENT_CONFIG: ContentConfig = {
    App: ({ children }) => {
        return <>{children}</>;
    },
    Document: ({ head, dangerouslySetInnerHTML }: DocumentProps) => {
        return (
            <html>
                <head>
                    {head}
                </head>
                <body>
                    <div dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
                </body>
            </html>
        );
    }
}

export function setContentConfig({ App, Document }: Partial<ContentConfig>) {
    if (App) {
        CONTENT_CONFIG.App = App
    }
    if (Document) {
        CONTENT_CONFIG.Document = Document
    }
}


export function getContentFrom<REQUEST, DATA>(
    Page: Page,
    { App, Document }: ContentConfig = CONTENT_CONFIG
): frugal.GetContent<REQUEST, DATA> {
    return ({
        data,
        url,
        path,
        context,
        cache,
    }) => {
        let head: preact.VNode[] = [];

        const html = server.render(<App path={path} context={context} cache={cache}>
            <HeadProvider
                onHeadUpdate={(nextHead) => {
                    head = nextHead;
                }}
            >
                <DataProvider context={{ data, url }}>
                    <Page path={path} context={context} cache={cache}/>
                </DataProvider>
            </HeadProvider>
        </App>);

        return `<!DOCTYPE html>${
            server.render(
                <Document
                    path={path}
                    context={context}
                    head={head}
                    dangerouslySetInnerHTML={{ __html: html }}
                />,
            )
        }`;
    };
}
