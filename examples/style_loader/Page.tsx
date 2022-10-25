/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { useData, PageProps } from '../../packages/frugal_preact/mod.server.ts';
import { cx } from '../../packages/loader_style/styled.ts';

import { Data } from './page.ts';
import { App } from './App.tsx';

import { Article } from './Article.island.tsx';
// we import some styles from a `.style.ts` file. Those imports respresents
// classnames, and client-side, they will be just strings.
import { bold, staticParagraph } from './Page.style.ts';

export function Page(props: PageProps) {
    const data = useData<Data>();

    return (
        <App {...props}>
            <Article title={data.title} content={data.content} />
            {/* To use imported className and combine them, we use the `cx` function */}
            <p className={cx(staticParagraph, bold)}>
                this is some static content
            </p>
        </App>
    );
}
