/** @jsxImportSource preact */
import * as svg from '../../packages/loader_jsx_svg/svg-sprite.ts';

const NAME = 'svg';
const ID = 'carret';

/* @__PURE__ */ svg.sprite(NAME, {
    id: ID,
    children: (
        <g>
            <path d='M14,17.414l-4.707-4.707c-0.391-0.391-0.391-1.023,0-1.414L14,6.586L15.414,8l-4,4l4,4L14,17.414z' />
        </g>
    ),
});

type CarretProps = Omit<
    preact.JSX.IntrinsicElements['svg'],
    'viewBox' | 'xlmns' | 'fill'
>;

export function Carret({ class: className, ...props }: CarretProps) {
    return (
        <svg
            {...props}
            class={className}
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
            fill='currentColor'
        >
            <use href={svg.spriteurl(NAME, ID)} />
        </svg>
    );
}
