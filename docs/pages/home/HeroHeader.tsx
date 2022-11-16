/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { cx } from '../../dep/frugal/styled.ts';

import * as s from './HeroHeader.style.ts';

type HeroHeader = {
    className?: string;
    children?: preact.ComponentChildren;
};

export function HeroHeader({ className, children }: HeroHeader) {
    return (
        <header class={cx(s.heroHeader, className)}>
            <h1 class={cx(s.title)}>
                <span class={cx(s.highlight)}>frugal</span> {children}
            </h1>
            <p class={cx(s.tagline)}>A web framework that waste not.</p>
        </header>
    );
}
