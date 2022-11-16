/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { SvgProps } from './type.ts';
import { carretUrl } from './SpriteSheet.svg.tsx';

const ROTATION = {
    left: undefined,
    right: 'rotate(180)',
    top: 'rotate(90)',
    bottom: 'rotate(-90)',
} as const;

type CarretProps = Omit<SvgProps, 'type'> & {
    type?: keyof typeof ROTATION;
};

export function Carret({ class: className, type, ...props }: CarretProps) {
    return (
        <svg
            {...props}
            class={className}
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
            fill='currentColor'
        >
            <use
                transform={type && ROTATION[type]}
                transform-origin='50% 50%'
                href={carretUrl}
            />
        </svg>
    );
}
