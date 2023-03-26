import { GetContent } from '../../../src/page/PageDescriptor.ts';
import HomePage from './HomePage.svelte';

export const self = import.meta.url;

export const pattern = '/';

export const getContent = getContentFrom(HomePage);

// deno-lint-ignore no-explicit-any
function getContentFrom(component: any): GetContent {
    return ({ descriptor, assets }) => {
        const { html, head } = component.render({ descriptor, assets });
        return `<!DOCTYPE html><html><head>${head}</head></body>${html}</body>`;
    };
}
