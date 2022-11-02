/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { Island } from '../../dep/frugal/preact.client.ts';

import { NAME } from './RefreshButton.script.ts';
import { RefreshButton as RefreshButtonBase } from './RefreshButton.tsx';

export function RefreshButton() {
    return <Island Component={RefreshButtonBase} name={NAME} />;
}
