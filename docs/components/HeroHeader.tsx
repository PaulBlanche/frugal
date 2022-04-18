/** @jsxImportSource preact */
import { cx } from '../dep/frugal/styled.ts';
import * as s from './HeroHeader.style.ts';

type HeroHeader = {
    compact?: boolean;
    children?: string;
};

export function HeroHeader({ compact, children }: HeroHeader) {
    return (
        <header class={cx(s.heroHeader, compact && s.compactHeroHeader)}>
            <h1 class={cx(s.title)}>
                <span class={cx(s.highlight)}>frugal</span>
                {children && <span class={cx(s.extra)}>{children}</span>}
            </h1>
            <p class={cx(s.tagline)}>Do the same, but send less.</p>
        </header>
    );
}
