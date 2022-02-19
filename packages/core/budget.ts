export const CONNECTIONS = {
    'slow 2G': 35 * 1000,
    '56k': 49 * 1000,
    'fast 2G': 150 * 1000,
    'edge': 240 * 1000,
    'slow 3G': 780 * 1000,
    'dsl': 1.5 * 1000 * 1000,
    'fast 3G': 1.6 * 1000 * 1000,
    'cable': 5 * 1000 * 1000,
    'adsl': 15 * 1000 * 1000,
    'slow fiber': 30 * 1000 * 1000,
    'slow 4G': 40 * 1000 * 1000,
    'fast 4G': 60 * 1000 * 1000,
    'fast fiber': 100 * 1000 * 1000,
};

import * as path from '../../dep/std/path.ts';
import * as dom from '../../dep/dom.ts';

const parser = new dom.DOMParser();

export async function size(filePath: string) {
    const document = parser.parseFromString(
        await Deno.readTextFile(filePath),
        'text/html',
    );

    const base = path.dirname(filePath);

    const sizePromises: Promise<number>[] = [localSize(filePath)];

    /*document?.querySelectorAll('script').forEach((script) => {
        const url = (script as dom.Element).getAttribute('src');
        if (url === null) {
            return;
        }

        if (url.startsWith('/')) {
            sizePromises.push(localSize(path.join(base, url)));
        } else {
            sizePromises.push(distantSize(url));
        }
    });

    document?.querySelectorAll('link').forEach((link) => {
        const rel = (link as dom.Element).getAttribute('rel');
        if (rel !== 'stylesheet') {
            return;
        }
        const url = (link as dom.Element).getAttribute('href');
        if (url === null) {
            return;
        }

        if (url.startsWith('/')) {
            sizePromises.push(localSize(path.join(base, url)));
        } else {
            sizePromises.push(distantSize(url));
        }
    });

    document?.querySelectorAll('img').forEach((img) => {
        const url = (img as dom.Element).getAttribute('src');
        const loading = (img as dom.Element).getAttribute('loading');
        if (url === null || loading === 'lazy') {
            return;
        }

        if (url.startsWith('/')) {
            sizePromises.push(localSize(path.join(base, url)));
        } else {
            sizePromises.push(distantSize(url));
        }
    });*/

    const sizes = await Promise.all(sizePromises);

    return sizes.reduce((a, b) => a + b);
}

async function localSize(filePath: string) {
    const stat = await Deno.stat(filePath);
    return stat.size;
}

async function distantSize(url: string) {
    const response = await fetch(url);
    const blob = await response.blob();
    return blob.size;
}
