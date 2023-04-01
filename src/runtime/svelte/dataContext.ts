import { getContext } from 'svelte';

export const DATA_CONTEXT_KEY = Symbol('DATA_CONTEXT_KEY');

type DataContext<DATA = unknown> = { data: DATA; pathname: string };

export function getData<DATA>() {
  return getContext<DataContext<DATA>>(DATA_CONTEXT_KEY).data;
}

export function getPathname() {
  return getContext<DataContext>(DATA_CONTEXT_KEY).data;
}
