import { Counter } from './Counter.tsx';
import { hydrate } from '../../../../dep/frugal/preact.client.ts';

export const NAME = 'Counter';

export function main() {
    hydrate(NAME, () => Counter);
}
