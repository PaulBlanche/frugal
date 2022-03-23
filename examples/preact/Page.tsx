/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import { Article } from './Article.iso.tsx';
import { useData } from '../../packages/frugal_preact/mod.client.ts';
import { Data } from './page.ts';

// This is the main component for the page
export function Page() {
    // the hook `useData` returns the data object used to generate the page. It
    // will also work inside a client-side component.
    const data = useData<Data>();

    return (
        <>
            <Article title={data.title} content={data.content} />
            <p>this is some static content</p>
        </>
    );
}
