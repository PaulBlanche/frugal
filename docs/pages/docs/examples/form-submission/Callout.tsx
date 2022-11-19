/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as hooks from 'preact/hooks';
import { cx } from '../../../../dep/frugal/styled.ts';

import * as svg from '../../../../svg/mod.ts';

import * as s from './Callout.style.ts';

type CalloutProps = preact.JSX.IntrinsicElements['div'];

export function Callout({ children, ...props }: CalloutProps) {
    const id = hooks.useId();

    return (
        <>
            <input
                class={cx(s.hiddenInput)}
                type='checkbox'
                id={id}
            />
            <div class={cx(s.callout)} {...props}>
                <label htmlFor={id} role='button'>
                    <svg.Close class={cx(s.icon)} />
                </label>
                {children}
            </div>
        </>
    );
}
