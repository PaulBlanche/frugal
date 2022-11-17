/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { cx } from '../../dep/frugal/styled.ts';
import { usePathname } from '../../dep/frugal/preact.client.ts';

import * as s from './Navigation.style.ts';

export const NAVIGATION_CLASS = 'mobile-toggle-navigation';

export function Navigation() {
    const pathname = usePathname();

    const isHome = pathname === '/';
    const isDocs = pathname.startsWith('/docs');

    return (
        <nav class={cx(s.navigation)}>
            <div class={cx(s.navigationContainer, NAVIGATION_CLASS)}>
                <NavigationEntry active={isHome} href='/'>
                    Home
                </NavigationEntry>{' '}
                <NavigationEntry active={isDocs} href='/docs'>
                    Docs
                </NavigationEntry>
                {' '}
            </div>
        </nav>
    );
}

type NavigationEntryProps = {
    children: preact.ComponentChildren;
    active?: boolean;
    href?: string;
};

function NavigationEntry(
    { active = false, children, href }: NavigationEntryProps,
) {
    if (active) {
        return (
            <span class={cx(s.entryActive)}>
                {children}
            </span>
        );
    }
    return (
        <a class={cx(s.entry)} href={href}>
            {children}
        </a>
    );
}
