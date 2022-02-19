/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import type * as frugal from '../../packages/core/mod.ts';
import {
    content,
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

export function getData({ request }: frugal.GetDataParams<Request>): Data {
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

export function getUrl({ request }: frugal.GetUrlParams<Request, Data>) {
    return `/${request.slug}.html`;
}

export const getContent = content(Page);

import { Article } from './Article.iso.tsx';
import { useData } from '../../packages/frugal_preact/mod.client.ts';

const entrypoint = new URL(import.meta.url).toString();

function Page({ context }: PageProps) {
    const data = useData<Data>();

    return (
        <>
            <Head>
                <title>toto</title>
                <script src={context['script-body'][entrypoint]['esm']}>
                </script>
            </Head>
            <Article title={data.title} content={data.content} />
            <p>this is some static content</p>
        </>
    );
}
