import { getContentFrom } from '../../../packages/frugal_preact/mod.server.ts';

import { App } from '../App.tsx';
import { Page } from './Page.tsx';

export function getRequestList() {
    return [{}];
}

export function getStaticData() {
    return {};
}

export const pattern = `/`;

export const self = new URL(import.meta.url);

export const getContent = getContentFrom(Page, { App });
