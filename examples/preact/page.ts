import type * as frugal from '../../packages/core/mod.ts';
import { getContentFrom } from '../../packages/frugal_preact/mod.server.ts';

import { App } from './App.tsx';
import { Page } from './Page.tsx';

type Request = { slug: string };

export type Data = {
    title: string;
    content: string;
};

export function getRequestList(): Request[] {
    return [{ slug: 'article-1' }, { slug: 'article-2' }];
}

export function getStaticData(
    { request }: frugal.GetStaticDataParams<Request>,
): Data {
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

export const pattern = `/:slug.html`;

export const getContent = getContentFrom(Page, { App });
