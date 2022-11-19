/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { Island } from '../../../../dep/frugal/preact.client.ts';

import { NAME } from './Counter.script.ts';
import { Counter as Component } from './Counter.tsx';

export function Counter() {
    return <Island Component={Component} name={NAME} />;
}
