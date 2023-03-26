import * as preact from '../../runtime/preact.server.ts';
import { GetContent } from '../../../src/page/PageDescriptor.ts';
import HomePage from './HomePage.svelte';

export const self = import.meta.url;

export const pattern = '/';

export const getContent = getContentFrom(HomePage);

function getContentFrom(component: any): GetContent {
    return ({ descriptor, assets }) => {
        const { html, head, css } = component.render({ descriptor, assets });
        return `<!DOCTYPE html><html><head>${head}</head></body>${html}</body>`;
    };
}
