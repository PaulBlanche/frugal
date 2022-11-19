import { getContentFrom } from '../../dep/frugal/preact.server.ts';

import { Page } from './Page.tsx';

export function getStaticData() {
    return {
        headers: {
            'Cache-Control': 'public, max-age=300, must-revalidate', // cached for 5min
        },
    };
}

export const pattern = `/`;

export const self = new URL(import.meta.url);

export const getContent = getContentFrom(Page);
