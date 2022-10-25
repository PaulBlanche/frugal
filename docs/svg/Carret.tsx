/* @jsxRuntime automatic */
/* @jsxImportSource preact */

import { SvgProps } from './type.ts';
import { carretUrl } from './SpriteSheet.svg.tsx';

export function Carret({ class: className, ...props }: SvgProps) {
    return (
        <svg
            {...props}
            class={className}
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
            fill='currentColor'
        >
            <use href={carretUrl} />
        </svg>
    );
}
