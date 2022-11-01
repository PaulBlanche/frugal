import * as preact from 'preact';
import { render } from 'preact-render-to-string';
import { marked } from '../dep/marked.ts';

import { Callout } from './Callout.tsx';

const CALLOUT_HINT = /\[(?:warn|info)\]>/;
const CALLOUT_REGEX =
    /^(?: {0,3}\[(warn|info)\]> ?(paragraph|[^\n]*)(?:\n|$))+/;

export class CalloutExtension
    implements marked.TokenizerExtension, marked.RendererExtension {
    name = 'callout';
    level = 'block' as const;

    start(src: string) {
        return src.match(CALLOUT_HINT)?.index;
    }

    tokenizer(this: marked.TokenizerThis, src: string) {
        const match = CALLOUT_REGEX.exec(src);
        if (match) {
            const text = match[0].replace(
                /\[(?:warn|info)\]/gm,
                '',
            ).replace(/^ *>[ \t]?/gm, '');
            console.log(src, match);
            const token = {
                type: 'callout',
                raw: match[0],
                kind: match[1],
                text,
                tokens: this.lexer.blockTokens(text, []),
            };
            return token;
        }
    }

    renderer(this: marked.RendererThis, token: marked.Tokens.Generic) {
        return render(
            preact.h(
                Callout,
                {
                    kind: token.kind,
                    content: this.parser.parse(token.tokens ?? []),
                },
            ),
        );
    }
}
