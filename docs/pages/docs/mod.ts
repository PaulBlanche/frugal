import * as frugal from '../../../packages/core/mod.ts';
import { getContentFrom } from '../../../packages/frugal_preact/mod.server.ts';

import { flattenToc, Toc } from '../../toc.ts';
import { Data, Request } from './type.ts';
import { App } from '../App.tsx';
import { Page } from './Page.tsx';

const TOC: Toc = {
    children: [
        {
            slug: '/introduction',
            name: 'introduction',
        },
        {
            slug: '/getting-started',
            name: 'getting started',
        },
        {
            slug: '/concepts',
            name: 'concepts',
            children: [
                {
                    slug: '/concepts/static-page',
                    name: 'static page',
                },
                {
                    slug: '/concepts/dynamic-page',
                    name: 'dynamic page',
                },
            ],
        },
    ],
};

export function getRequestList() {
    const slugs = flattenToc(TOC).map((node) => node.slug).filter((
        slug,
    ): slug is string => slug !== undefined);
    return [...slugs.map((slug) => ({ slug })), { slug: '' }];
}

async function readMarkup(name: string) {
    return await Deno.readTextFile(
        new URL(`../../data${name}`, import.meta.url),
    );
}

async function getMarkup(slug: string) {
    if (slug === '') {
        return await readMarkup('/introduction.md');
    }
    try {
        return await readMarkup(`${slug}.md`);
    } catch {
        return await readMarkup(`${slug}/index.md`);
    }
}

export async function getStaticData(
    { request }: frugal.GetStaticDataParams<Request>,
): Promise<Data> {
    const markup = await getMarkup(request.slug);
    return {
        toc: TOC,
        markup,
    };
}

export const pattern = `/docs:slug(.*)`;

export const self = new URL(import.meta.url);

export const getContent = getContentFrom<Request, Data>(Page, {
    App,
    embedData: false,
});
