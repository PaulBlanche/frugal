import { Article } from './Article.tsx';
import { hydrate } from '../../packages/frugal_preact/mod.client.ts';

export const NAME = 'article';

export function main() {
    hydrate(NAME, () => Article);
}
