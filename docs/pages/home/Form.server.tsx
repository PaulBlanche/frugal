/** @jsxImportSource preact */
import { Host } from '../../dep/frugal/frugal_preact.client.ts';

import { NAME } from './Form.script.ts';
import { Form as FormBase, FormProps } from './Form.tsx';

export function Form(props: FormProps) {
    return <Host props={props} Component={FormBase} name={NAME} />;
}
