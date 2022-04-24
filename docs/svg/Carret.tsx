/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import { carretUrl } from './SpriteSheet.svg.tsx';

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
            <use href={carretUrl} />
        </svg>
    );
}
