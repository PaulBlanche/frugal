/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { SvgProps } from './type.ts';
import { linkUrl } from './SpriteSheet.svg.tsx';

export function Link({ class: className, ...props }: SvgProps) {
    return (
        <svg
            {...props}
            class={className}
            viewBox='0 0 457.03 457.03'
            xmlns='http://www.w3.org/2000/svg'
            fill='currentColor'
        >
            <use href={linkUrl} />
        </svg>
    );
}
