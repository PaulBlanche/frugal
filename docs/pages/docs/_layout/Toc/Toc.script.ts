import { hydrate } from '../../../../dep/frugal/preact.client.ts';

import { Toc } from './Toc.tsx';

export const NAME = 'Toc';

export async function main() {
    // inert polyfill
    await import('../../../../dep/wicg-inert.ts');

    hydrate(NAME, () => Toc);
}
