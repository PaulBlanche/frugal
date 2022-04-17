/** @jsxImportSource preact */
import { Host } from '../../dep/frugal/frugal_preact.client.ts';

import { NAME } from './Form.script.ts';
import { Form as FormBase } from './Form.tsx';

export function Form() {
    return <Host props={{}} Component={FormBase} name={NAME} />;
}
