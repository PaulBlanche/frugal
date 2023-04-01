import { PathList } from '../../../page.ts';

export const self = import.meta.url;

export const pattern = '/:foo/:bar';

export function getPathList(): PathList<typeof pattern> {
  return [{ foo: 'foo', bar: 'bar' }, { foo: 'fooz', bar: 'baz' }];
}

export function getContent() {
  return `Hello world`;
}
