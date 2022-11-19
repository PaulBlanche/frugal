/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { cx } from '../../../dep/frugal/styled.ts';

import * as s from '../../../styles/link.style.ts';

type LinkProps = {
    text: string;
} & preact.JSX.IntrinsicElements['a'];

export function Link({ class: className, text, ...props }: LinkProps) {
    return (
        <a
            {...props}
            dangerouslySetInnerHTML={{ __html: text }}
            class={cx(s.link)}
            rel={props.href === undefined || !hasProtocol(props.href)
                ? props.rel
                : `${props.rel ?? ''} noopener noreferrer`.trim()}
        />
    );
}

const PROTOCOL_REGEXP = /^(?:[a-z+]+:)?\/\//;
export function hasProtocol(href: string | preact.JSX.SignalLike<string>) {
    return PROTOCOL_REGEXP.test(typeof href === 'string' ? href : href.peek());
}
