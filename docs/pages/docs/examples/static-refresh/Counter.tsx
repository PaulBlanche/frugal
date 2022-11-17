/* @jsxRuntime automatic */
/* @jsxImportSource preact */

import { signal } from 'preact/signals';
import { cx } from '../../../../dep/frugal/styled.ts';

import * as s from './Counter.style.ts';

const count = signal(0);

export function Counter() {
    return (
        <div class={cx(s.wrapper)}>
            <button class={cx(s.button)} onClick={() => count.value -= 1}>
                -
            </button>
            <span class={cx(s.value)}>{count}</span>
            <button class={cx(s.button)} onClick={() => count.value += 1}>
                +
            </button>
        </div>
    );
}
