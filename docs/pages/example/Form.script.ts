import { Form } from './Form.tsx';
import { hydrate } from '../../dep/frugal/preact.client.ts';

export const NAME = 'Form';

export function main() {
    hydrate(NAME, () => Form);
}
