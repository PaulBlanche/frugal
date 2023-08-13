/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as server from "preact-render-to-string";
import { HeadProvider } from "./Head.tsx";
import * as descriptor from "../../page/PageDescriptor.ts";
import { JSONValue } from "../../page/JSONValue.ts";
import { DataProvider } from "./dataContext.tsx";
import { ISLAND_END } from "./Island.tsx";

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

type RenderConfig = {
    Document?: Document;
    embedData?: boolean;
};

const DEFAULT_DOCUMENT: Document = (
    { head: state, dangerouslySetInnerHTML }: DocumentProps,
) => {
    const htmls = state.filter((node) => node.type === "html");
    const bodys = state.filter((node) => node.type === "body");
    const head = state.filter((node) => node.type !== "html");

    const htmlProps = {};
    for (const html of htmls) {
        Object.assign(htmlProps, html.props);
    }

    const bodyProps = {};
    for (const body of bodys) {
        Object.assign(bodyProps, body.props);
    }

    return (
        <html {...htmlProps}>
            <head>
                {head}
            </head>
            <body {...bodyProps} dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
        </html>
    );
};

export function getRenderFrom<PATH extends string, DATA extends JSONValue>(
    Page: Page,
    {
        Document = DEFAULT_DOCUMENT,
        embedData = false,
    }: RenderConfig = {},
): descriptor.Render<PATH, DATA> {
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
                    context={{ data, embedData, pathname }}
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
            ).replace(`</!--${ISLAND_END}-->`, "")
        }`;
    };
}
