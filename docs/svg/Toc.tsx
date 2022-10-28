/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as hooks from 'preact/hooks';

import { SvgProps } from './type.ts';
import { tocUrl } from './SpriteSheet.svg.tsx';

export function Toc({ ...props }: SvgProps) {
    const id = hooks.useId();

    return (
        <svg
            {...props}
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
            stroke='currentColor'
            fill='none'
            aria-labelledby={id}
            role='img'
        >
            <title id={id}>Table of content</title>
            <use href={tocUrl} />
        </svg>
    );
}
