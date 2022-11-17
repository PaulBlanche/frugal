/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { Island } from '../../../../dep/frugal/preact.client.ts';

import { NAME } from './ExampleForm.script.ts';
import { ExampleForm as ExampleFormBase } from './ExampleForm.tsx';

export function ExampleForm() {
    return <Island Component={ExampleFormBase} name={NAME} />;
}
