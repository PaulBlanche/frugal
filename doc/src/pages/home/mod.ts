import { DataResponse } from 'frugal/page.ts';
import { getContentFrom } from 'frugal/runtime/preact.server.ts';

import { Page } from './Page.tsx';

export function GET() {
    return new DataResponse(undefined, {
        headers: {
            'Cache-Control': 'public, max-age=300, must-revalidate', // cached for 5min
        },
    });
}

export const pattern = `/`;

export const self = import.meta.url;

export const getContent = getContentFrom(Page);
