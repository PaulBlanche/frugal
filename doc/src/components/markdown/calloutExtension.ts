import * as preact from "preact";
import { render } from "preact-render-to-string";
import * as marked from "$dep/marked.ts";

import { Callout } from "./Callout.tsx";

const CALLOUT_HINT = /^>\s*\[!(.*)\]/m;
const CALLOUT_REGEX = /^>\s*\[!(.*)\](.*)?\n((?:>.*\n)*)$/m;

export function calloutExtension() {
    return {
        name: "callout",
        level: "block",

        start(src: string) {
            return src.match(CALLOUT_HINT)?.index;
        },

        tokenizer(this: marked.TokenizerThis, src: string) {
            const match = CALLOUT_REGEX.exec(src);
            if (match && match.index === 0) {
                const title: marked.Tokens.Generic[] = [];
                this.lexer.inline(match[2], title);

                const text: marked.Tokens.Generic[] = [];
                this.lexer.blockTokens(match[3].replace(/^>[^\S\r\n]*/gm, ""), text);

                return {
                    type: "callout",
                    raw: match[0],
                    kind: match[1],
                    title,
                    text,
                };
            }
        },

        renderer(this: marked.RendererThis, token: marked.Tokens.Generic) {
            return render(
                preact.h(
                    Callout,
                    {
                        kind: token.kind,
                        title: this.parser.parseInline(token.title),
                        content: this.parser.parse(token.text),
                    },
                ),
            );
        },
    };
}
