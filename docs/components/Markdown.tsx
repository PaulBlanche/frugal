import * as preact from 'preact';
import * as gmf from '../../dep/gmf.ts';
import { cx } from '../../packages/loader_style/styled.ts';

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
            dangerouslySetInnerHTML: { __html: gmf.render(markup) },
        })
    );
}
