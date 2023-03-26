import * as preact from '../../runtime/preact.client.ts';
import { Counter } from './Counter.tsx';

export const NAME = 'Counter';

if (import.meta.main) {
    preact.hydrate(NAME, () => Counter);
}
