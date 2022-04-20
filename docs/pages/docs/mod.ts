import * as frugal from '../../dep/frugal/core.ts';
import { getContentFrom } from '../../dep/frugal/frugal_preact.server.ts';

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
                    slug: '/concepts/page-descriptor',
                    name: 'page descriptor',
                    children: [
                        {
                            slug: '/concepts/page-descriptor/static-page',
                            name: 'static page',
                        },
                        {
                            slug: '/concepts/page-descriptor/dynamic-page',
                            name: 'dynamic page',
                        },
                    ],
                },
                {
                    slug: '/concepts/loaders',
                    name: 'loaders',
                    children: [
                        {
                            slug: '/concepts/loaders/style-loader',
                            name: 'style loader',
                        },
                        {
                            slug: '/concepts/loaders/script-loader',
                            name: 'script loader',
                        },
                    ],
                },
            ],
        },
        {
            slug: '/other-modules',
            name: 'other modules',
            children: [
                {
                    slug: '/other-modules/preact-integration',
                    name: 'preact integration',
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
