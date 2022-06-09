import { getContentFrom } from '../../dep/frugal/frugal_preact.server.ts';

import { App } from '../App.tsx';
import { Page } from './Page.tsx';

export function getStaticHeaders() {
    return new Headers({
        'Cache-Control': 'public, max-age=3600, must-revalidate', // cached for the hour
    });
}

export const pattern = `/`;

export const self = new URL(import.meta.url);

export const getContent = getContentFrom(Page, { App });
