import * as preact from 'preact';
import { parse } from './parse.ts';
import { cx } from '../../../dep/frugal/styled.ts';

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
            class: cx(className),
            dangerouslySetInnerHTML: { __html: parse(markup) },
        })
    );
}
