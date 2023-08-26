/* @jsxRuntime automatic */
/* @jsxImportSource solid-js */
import { HydrationScript, NoHydration, render, renderToString } from "solid-js/web";
import * as solid from "solid-js";
import { MetaProvider, renderTags } from "@solidjs/meta";
import * as descriptor from "../../page/PageDescriptor.ts";
import { JSONValue } from "../../page/JSONValue.ts";
import { DataProvider } from "./dataContext.tsx";
import { Assets } from "../../page/Assets.ts";

export type PageProps = {
    descriptor: string;
    assets: Assets;
};

export type Page = solid.Component<PageProps>;

export type DocumentProps = {
    tags: any[];
    descriptor: string;
    assets: Assets;
    innerHTML: string;
};

export type Document = solid.Component<DocumentProps>;

type RenderConfig = {
    Document?: Document;
    embedData?: boolean;
};

const DEFAULT_DOCUMENT: Document = (
    { tags, innerHTML }: DocumentProps,
) => {
    return (
        <html>
            <head innerHTML={renderTags(tags)} />
            <body innerHTML={innerHTML} />
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
        const tags: any[] = [];

        const html = renderToString(() => (
            <NoHydration>
                <MetaProvider tags={tags}>
                    <DataProvider context={{ data, embedData, pathname }}>
                        <HydrationScript />
                        <Page
                            descriptor={descriptor}
                            assets={assets}
                        />
                    </DataProvider>
                </MetaProvider>
            </NoHydration>
        ));

        return `<!DOCTYPE html>${
            renderToString(() => (
                <Document
                    descriptor={descriptor}
                    assets={assets}
                    tags={tags}
                    innerHTML={html}
                />
            ))
        }`;
    };
}
