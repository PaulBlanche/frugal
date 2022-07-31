/* @jsxRuntime automatic */
/* @jsxImportSource preact */

import { cx } from '../dep/frugal/styled.ts';

import { SvgProps } from './type.ts';
import { spinnerUrl } from './SpriteSheet.svg.tsx';
import * as s from './Spinner.style.tsx';

export function Spinner({ class: className, ...props }: SvgProps) {
    return (
        <svg
            {...props}
            class={cx(
                typeof className === 'object' ? className.peek() : className,
                s.spinner,
            )}
            viewBox='0 0 100 100'
            xmlns='http://www.w3.org/2000/svg'
            fill='currentColor'
        >
            <use className={cx(s.circle)} href={spinnerUrl} />
        </svg>
    );
}
