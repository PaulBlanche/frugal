/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as preact from 'preact';
import { cx } from '../dep/frugal/styled.ts';
import Prism from '../dep/prism.ts';
import * as he from '../dep/he.ts';

import * as s from './Code.style.ts';

type CodeProps = {
    code: string;
    language?: string;
} & preact.JSX.IntrinsicElements['pre'];

export function Code({ code, language, ...props }: CodeProps) {
    const cleanLanguage = language?.split(',')?.[0];

    return (
        <pre
            {...props}
            class={cx(
                props.class ?? props.className,
                s.highlight,
                `language-${cleanLanguage}`,
            )}
        >
            <code
                dangerouslySetInnerHTML={{
                    __html: cleanLanguage && cleanLanguage in Prism.languages ? Prism.highlight(code, Prism.languages[cleanLanguage], cleanLanguage) : he.escape(code)
                }}
            />
        </pre>
    );
}
