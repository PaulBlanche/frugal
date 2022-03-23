import { Article } from './Article.tsx';
import { hydrate } from '../../packages/frugal_preact/mod.client.ts';

export const NAME = 'article';

// The main function for any `.script.ts` file. This will hydrate client-side
// the raw `Article` component everywhere the `Host` of this component was
// rendered server-side
export function main() {
    hydrate(NAME, () => Article);
}
