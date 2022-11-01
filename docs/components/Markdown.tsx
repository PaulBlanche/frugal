import * as preact from 'preact';
import { parse } from '../markdown/mod.ts';
import { cx } from '../dep/frugal/styled.ts';

import * as s from './Markdown.style.ts';

type MarkdownProps = {
    as?: string;
    class?: string;
    markup: string;
};

export function Markdown(
    { as = 'div', class: className, markup }: MarkdownProps,
) {
    return (
        preact.createElement(as, {
            class: cx(s.markdown, className, 'markdown-body'),
            dangerouslySetInnerHTML: { __html: parse(markup) },
        })
    );
}
