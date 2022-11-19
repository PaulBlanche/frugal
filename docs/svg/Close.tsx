/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { SvgProps } from './type.ts';
import { closeUrl } from './SpriteSheet.svg.tsx';

export function Close({ class: className, ...props }: SvgProps) {
    return (
        <svg
            {...props}
            class={className}
            viewBox='0 0 1000 1000'
            xmlns='http://www.w3.org/2000/svg'
            fill='currentColor'
        >
            <use href={closeUrl} />
        </svg>
    );
}
