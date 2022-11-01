/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as preact from 'preact';

type LinkProps = preact.JSX.IntrinsicElements['a'];

export function Link(
    props: LinkProps,
) {
    return (
        <a
            {...props}
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
