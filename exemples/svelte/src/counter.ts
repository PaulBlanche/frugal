import { GetContent } from '../../../src/page/PageDescriptor.ts';
import CounterPage from './CounterPage.svelte';

export const self = import.meta.url;

export const pattern = '/counter';

export const getContent = getContentFrom(CounterPage);

function getContentFrom(component: any): GetContent {
    return ({ descriptor, assets }) => {
        const { html, head, css } = component.render({ descriptor, assets });
        return `<!DOCTYPE html><html><head>${head}</head></body>${html}</body>`;
    };
}
