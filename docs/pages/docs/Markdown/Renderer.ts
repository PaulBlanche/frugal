import * as preact from 'preact';
import { render } from 'preact-render-to-string';
import { marked } from '../../../dep/marked.ts';

import { Heading } from './Heading.tsx';
import { Code } from './Code.tsx';
import { Link } from './Link.tsx';

export class Renderer extends marked.Renderer {
    heading(
        this: marked.RendererThis,
        text: string,
        level: 1 | 2 | 3 | 4 | 5 | 6,
        raw: string,
        slugger: marked.Slugger,
    ) {
        const id = slugger.slug(raw);

        return render(
            preact.h(Heading, {
                level,
                id,
                text,
            }),
        );
    }

    code(code: string, language?: string) {
        return render(preact.h(Code, { code, language }));
    }

    link(href: string, title: string, text: string) {
        return render(preact.h(Link, { href, title, text }));
    }
}

const PROTOCOL_REGEXP = /^(?:[a-z+]+:)?\/\//;
export function hasProtocl(href: string) {
    return PROTOCOL_REGEXP.test(href);
}
