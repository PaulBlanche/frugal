/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { Island } from '../../../../dep/frugal/preact.client.ts';

import { NAME } from './Toc.script.ts';
import { Toc as Component, TocProps } from './Toc.tsx';

export function Toc(props: TocProps) {
    return <Island Component={Component} props={props} name={NAME} />;
}
