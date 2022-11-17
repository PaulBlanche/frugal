import { ExampleForm } from './ExampleForm.tsx';
import { hydrate } from '../../../../dep/frugal/preact.client.ts';

export const NAME = 'ExampleForm';

export function main() {
    hydrate(NAME, () => ExampleForm);
}
