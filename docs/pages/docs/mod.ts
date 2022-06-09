import * as frugal from '../../dep/frugal/core.ts';
import { getContentFrom } from '../../dep/frugal/frugal_preact.server.ts';

import { flattenToc, Toc } from '../../toc.ts';
import { Data, Path } from './type.ts';
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
            slug: '/integration',
            name: 'integration',
            children: [
                {
                    slug: '/integration/preact-integration',
                    name: 'preact integration',
                },
                {
                    slug: '/integration/oak-integration',
                    name: 'oak integration',
                },
            ],
        },
    ],
};

export function getPathList(): Path[] {
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
    { path }: frugal.GetStaticDataParams<frugal.PathObject<typeof pattern>>,
): Promise<Data> {
    const markup = await getMarkup(path.slug);
    return {
        toc: TOC,
        markup,
    };
}

export function getStaticHeaders() {
    return new Headers({
        'Cache-Control': 'public, max-age=3600, must-revalidate', // cached for the hour
    });
}

export const pattern = `/docs:slug(.*)`;

export const self = new URL(import.meta.url);

export const getContent = getContentFrom<Path, Data>(Page, {
    App,
    embedData: false,
});
