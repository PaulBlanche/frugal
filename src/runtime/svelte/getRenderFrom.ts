import { JSONValue } from "../../page/JSONValue.ts";
import * as descriptor from "../../page/PageDescriptor.ts";
import { ServerComponent } from "./ServerComponent.ts";
import { DATA_CONTEXT_KEY } from "./dataContext.ts";

export type Document = (head: string, html: string) => string;

const DEFAULT_DOCUMENT: Document = (head, html) => `<!DOCTYPE html><html><head>${head}</head></body>${html}</body>`;

type GetContentConfig = {
    document?: Document;
    embedData?: boolean;
};

export function getRenderFrom<PATH extends string, DATA extends JSONValue>(
    component: ServerComponent,
    { document = DEFAULT_DOCUMENT, embedData = true }: GetContentConfig = {},
): descriptor.Render<PATH, DATA> {
    return ({ descriptor, assets, data, pathname }) => {
        const context = { data, pathname };

        const { html, head } = component.render({ descriptor, assets }, {
            context: new Map([[DATA_CONTEXT_KEY, context]]),
        });

        let enrichedHtml = html;
        if (embedData) {
            const script = `<script>window.__FRUGAL__ = ${JSON.stringify({ context })};</script>`;
            enrichedHtml = script + enrichedHtml;
        }

        return document(head, enrichedHtml);
    };
}
