import { marked } from "$dep/marked.ts";

import { calloutExtension } from "./calloutExtension.ts";
import { Renderer } from "./Renderer.ts";

marked.use({
    extensions: [calloutExtension()],
});

const renderer = new Renderer();

type Parsed = { html: string; toc: { label: string; id: string; level: number }[] };

export function parse(markup: string, variables: Record<string, string> = {}): Parsed {
    renderer.reset();

    const html = marked.parse(
        markup.replaceAll(/\{\{(.*?)\}\}/g, (match, name) => {
            return name in variables ? String(variables[name]) : match;
        }),
        {
            renderer,
            mangle: false, // silence warning, mangle is not used anyway
            headerIds: false, // silence warning, ids are computed in Renderer anyway
        },
    );

    return { html, toc: renderer.toc };
}
