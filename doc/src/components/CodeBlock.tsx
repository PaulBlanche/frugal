/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as preact from 'preact';
import Prism from '$dep/prism.ts';
import * as he from '$dep/he.ts';
import { clsx } from '$dep/clsx.ts';

// @deno-types="frugal/css-module.d.ts"
import codeblock from './CodeBlock.module.css';

type CodeBlock = {
    code: string;
    language?: string;
} & preact.JSX.IntrinsicElements['pre'];

export function CodeBlock({ code, language, ...props }: CodeBlock) {
    const cleanLanguage = language?.split(',')?.[0];

    return (
        <pre
            {...props}
            class={clsx(
                props.class ?? props.className,
                codeblock['highlight'],
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
