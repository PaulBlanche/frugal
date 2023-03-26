/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as preact from '../../runtime/preact.client.ts';
import { Counter, CounterProps } from './Counter.tsx';

import { NAME } from './Counter.script.ts';

export function CounterIsland(props: CounterProps) {
    return <preact.Island name={NAME} Component={Counter} props={props} />;
}
