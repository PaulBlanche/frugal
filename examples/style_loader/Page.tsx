/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import { Article } from './Article.island.tsx';
import { useData } from '../../packages/frugal_preact/mod.client.ts';
import { cx } from '../../packages/loader_style/styled.ts';
import { Data } from './page.ts';

// we import some styles from a `.style.ts` file. Those imports respresents
// classnames, and client-side, they will be just strings.
import { bold, staticParagraph } from './Page.style.ts';

export function Page() {
    const data = useData<Data>();

    return (
        <>
            <Article title={data.title} content={data.content} />
            {/* To use imported className and combine them, we use the `cx` function */}
            <p className={cx(staticParagraph, bold)}>
                this is some static content
            </p>
        </>
    );
}
