/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as preact from 'preact';
import { cx } from '../dep/frugal/styled.ts';

import * as svg from '../svg/mod.ts';

import * as s from './Heading.style.ts';

type HeadingProps = {
    level: 1 | 2 | 3 | 4 | 5 | 6;
    text: string;
} & preact.JSX.IntrinsicElements['h1'];

export function Heading({ level, text, ...props }: HeadingProps) {
    const Heading: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' = `h${level}`;
    return (
        <Heading {...props} class={cx(props.class, s.heading)}>
            <span dangerouslySetInnerHTML={{ __html: text }} />
            {props.id && (
                <a
                    href={`#${props.id}`}
                    aria-hidden='true'
                    tabIndex={-1}
                    class={cx(s.anchor)}
                >
                    <svg.Link class={cx(s.icon)} />
                </a>
            )}
        </Heading>
    );
}
