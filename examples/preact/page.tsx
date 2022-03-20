/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import type * as frugal from '../../packages/core/mod.ts';
import {
    getContentFrom,
    Head,
    PageProps,
} from '../../packages/frugal_preact/mod.server.ts';

type Request = { slug: string };

type Data = {
    title: string;
    content: string;
};

export function getRequestList(): Request[] {
    return [{ slug: 'article-1' }, { slug: 'article-2' }];
}

export function getStaticData({ request }: frugal.GetStaticDataParams<Request>): Data {
    if (request.slug === 'article-1') {
        return {
            title: 'first article !',
            content: 'this is the first article',
        };
    }
    return {
        title: 'another article',
        content: 'this is another article',
    };
}

export const pattern = `/:slug.html`

export const getContent = getContentFrom(Page, { App });

import { Article } from './Article.iso.tsx';
import { useData, AppProps } from '../../packages/frugal_preact/mod.client.ts';
import type { Generated } from '../../packages/loader_script/mod.ts'

function Page() {
    const data = useData<Data>();

    return (
        <>
            <Article title={data.title} content={data.content} />
            <p>this is some static content</p>
        </>
    );
}

function App({ entrypoint, loaderContext, children }: AppProps) {
    const scriptGenerated = loaderContext.get<Generated>('script-body')
    const esmBundleUrl = scriptGenerated[entrypoint]['esm']
    return <>
        <Head>
            <meta charSet='utf-8' />
            <title>toto</title>
        </Head>
        {children}
        <script src={esmBundleUrl}></script>
    </>
}