import type * as frugal from '../../packages/core/mod.ts';
import { getContentFrom } from '../../packages/frugal_preact/mod.server.ts';

import { App } from './App.tsx';
import { Page } from './Page.tsx';

type Path = { slug: string };

export type Data = {
    title: string;
    content: string;
};

export function getPathList(): Path[] {
    return [{ slug: 'article-1' }, { slug: 'article-2' }];
}

export function getStaticData(
    { path }: frugal.GetStaticDataContext<Path>,
): frugal.DataResult<Data> {
    if (path.slug === 'article-1') {
        return {
            data: {
                title: 'first article !',
                content: 'this is the first article',
            }
        };
    }
    return {
        data:{
            title: 'another article',
            content: 'this is another article',
        }
    };
}

export const pattern = `/:slug.html`;

export const self = new URL(import.meta.url);

export const getContent = getContentFrom(Page);
