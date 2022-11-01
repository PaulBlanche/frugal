/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { cx } from '../dep/frugal/styled.ts';

import * as s from './Callout.style.ts';

type CalloutProps = {
    kind: 'warn' | 'info';
    content: string;
};

export function Callout({ kind, content }: CalloutProps) {
    return (
        <div
            class={cx(kind === 'warn' ? s.warning : s.info)}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}
