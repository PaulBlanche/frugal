import Counter from './Counter.svelte';
import { hydrate } from '../../../runtime/svelte.ts';

export const NAME = 'Counter';

if (import.meta.main) {
    hydrate(NAME, () => Counter);
}
