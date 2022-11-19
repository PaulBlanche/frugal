/* @jsxRuntime automatic */
/* @jsxImportSource preact */

import { signal } from 'preact/signals';
import { cx } from '../../../../dep/frugal/styled.ts';
import { useSignal } from '../../../../hooks/useSignal.ts';

import * as s from './Counter.style.ts';

const countSignal = signal(0);

export function Counter() {
    const count = useSignal(countSignal);

    return (
        <div class={cx(s.wrapper)}>
            <button class={cx(s.button)} onClick={() => countSignal.value -= 1}>
                -
            </button>
            <span class={cx(s.value)}>{`${count}`}</span>
            <button class={cx(s.button)} onClick={() => countSignal.value += 1}>
                +
            </button>
        </div>
    );
}
