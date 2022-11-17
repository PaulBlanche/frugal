import * as frugal from '../../dep/frugal/core.ts';
import { getContentFrom } from '../../dep/frugal/preact.server.ts';

import { flattenToc, Toc } from './toc.ts';
import { Data, Path, PATTERN } from './type.ts';
import { Page } from './Page.tsx';

const TOC: Toc = JSON.parse(
    await Deno.readTextFile(
        new URL('./data/toc.json', import.meta.url).pathname,
    ),
);

export function getPathList(): Path[] {
    const slugs = flattenToc(TOC)
        .filter((node) => node.slug && !node.external)
        .map((node) => node.slug) as string[];
    return [...slugs.map((slug) => ({ slug })), { slug: '' }];
}

async function readMarkup(name: string) {
    return await Deno.readTextFile(
        new URL(`./data${name}`, import.meta.url),
    );
}

async function getMarkup(slug: string) {
    if (slug === '') {
        return await readMarkup('/introduction.md');
    }
    try {
        return await readMarkup(`${slug}.md`);
    } catch {
        try {
            return await readMarkup(`${slug}/index.md`);
        } catch (e) {
            throw e;
        }
    }
}

export async function getStaticData(
    { path }: frugal.GetStaticDataContext<Path>,
): Promise<frugal.DataResult<Data>> {
    try {
        const markup = await getMarkup(path.slug);
        return {
            data: {
                toc: TOC,
                markup,
            },
            headers: {
                'Cache-Control': 'public, max-age=300, must-revalidate', // cached for 5min
            },
        };
    } catch {
        return { status: 404 };
    }
}

export const pattern = PATTERN;

export const self = new URL(import.meta.url);

export const getContent = getContentFrom<Path, Data>(Page);
