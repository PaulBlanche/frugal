import Prism from "$dep/prism.ts";
import he from "$dep/he.ts";
import { clsx } from "$dep/clsx.ts";

import highlight from "./Highlight.module.css";
import { File } from "./type.ts";

type HighlightProps = {
    file: File;
    noLineNumbers?: boolean;
} & preact.JSX.IntrinsicElements["div"];

export function Highlight(
    {
        file: { code, filename, language, highlights },
        noLineNumbers = false,
        class: className,
        ...divProps
    }: HighlightProps,
) {
    const htmlCode = language && language in Prism.languages
        ? Prism.highlight(code, Prism.languages[language], language)
        : he.escape(code);

    return (
        <div {...divProps} data-id={filename} class={clsx(className, highlight["wrapper"])}>
            <pre
                class={clsx(
                    highlight["highlight"],
                    !noLineNumbers && highlight["highlight-line-numbers"],
                )}
            >
                <code
                    class={clsx(
                        highlight['code'],
                        language && `language-${language}`
                    )}
                    dangerouslySetInnerHTML={{ __html:  htmlCode }}
                />
            </pre>
            {
                <pre class={clsx(highlight["line-numbers"], language && `language-${language}`)}>
                    {!noLineNumbers && Array.from({ length: lineNumbers(code) }, (_, i) => {
                        return <div>{i + 1}</div>;
                    })}
                </pre>
            }
            {highlights && (
                <pre class={clsx(highlight["line-highlights"], language && `language-${language}`)}>
                    {lineHighlights(highlights).map(({ isHighlighted, length }) => {
                        return <div class={clsx(isHighlighted && highlight["highlight"])}>{"\n".repeat(length)}</div>;
                    })}
                </pre>
            )}
        </div>
    );
}

function lineHighlights(lines: [number, number][]) {
    const highlights: { isHighlighted: boolean; length: number }[] = [];
    let lastHighlightEnd = 0;
    for (const line of lines) {
        const padLength = line[0] - lastHighlightEnd - 1;
        if (padLength > 0) {
            highlights.push({ isHighlighted: false, length: padLength });
        }
        const highlightLength = line[1] - line[0] + 1;
        highlights.push({ isHighlighted: true, length: highlightLength });
        lastHighlightEnd = line[1];
    }

    return highlights;
}

const LINE_END_REGEXP = /\n(?!$)/g;
function lineNumbers(code: string) {
    const match = code.match(LINE_END_REGEXP);
    return match ? match.length + 1 : 1;
}
