/* @jsxRuntime automatic */
/* @jsxImportSource preact */

import { Article } from './Article.island.tsx';
import { useData, PageProps } from '../../packages/frugal_preact/mod.server.ts';
import { Data } from './page.ts';
import { App } from './App.tsx';

// This is the main component for the page
export function Page(props: PageProps) {
    // the hook `useData` returns the data object used to generate the page. It
    // will also work inside a client-side component.
    const data = useData<Data>();

    return (
        <App {...props}>
            <Article title={data.title} content={data.content} />
            <p>this is some static content</p>
        </App>
    );
}
