import { getContentFrom } from 'frugal/runtime/svelte.server.ts';

//@deno-types="frugal/runtime/svelte/page.d.ts"
import HomePage from './HomePage.svelte';
import { DataResponse } from '../../../src/page/FrugalResponse.ts';

export const self = import.meta.url;

export const pattern = '/';

export function GET() {
  return new DataResponse({ framework: 'svelte' });
}

export const getContent = getContentFrom(HomePage);
