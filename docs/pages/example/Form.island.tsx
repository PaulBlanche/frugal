/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { Island } from '../../dep/frugal/preact.client.ts';

import { NAME } from './Form.script.ts';
import { Form as FormBase } from './Form.tsx';

export function Form() {
    return <Island Component={FormBase} name={NAME} />;
}
