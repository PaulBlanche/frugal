/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { usePathname } from '$dep/frugal/runtime/preact.client.ts';
import { clsx } from '$dep/clsx.ts';

// @deno-types="frugal/css-module.d.ts"
import navigation from './Navigation.module.css';

export const NAVIGATION_CLASS = 'mobile-toggle-navigation';

export function Navigation() {
    const pathname = usePathname();

    const isHome = pathname === '/';
    const isDocs = pathname.startsWith('/docs');

    return (
        <nav class={clsx(navigation['navigation'], NAVIGATION_CLASS)}>
            <div class={clsx(navigation['navigation-container'])}>
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
            <span class={clsx(navigation['entry-active'])}>
                {children}
            </span>
        );
    }
    return (
        <a class={clsx(navigation['entry'])} href={href}>
            {children}
        </a>
    );
}
