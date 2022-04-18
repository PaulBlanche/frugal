/** @jsxImportSource preact */
import { cx } from '../dep/frugal/styled.ts';
import { usePathname } from '../dep/frugal/frugal_preact.server.ts';
import * as s from './Navigation.style.ts';

export function Navigation() {
    const pathname = usePathname();

    const isHome = pathname === '/index.html';
    const isDocs = pathname.startsWith('/docs');
    const isExample = pathname.startsWith('/example');

    return (
        <div class={cx(s.wrapper)}>
            <nav class={cx(s.navigation)}>
                <NavigationEntry active={isHome} href='/'>
                    Home
                </NavigationEntry>
                <NavigationEntry active={isDocs} href='/docs'>
                    Docs
                </NavigationEntry>
                <NavigationEntry active={isExample} href='/example'>
                    Example
                </NavigationEntry>
                <NavigationEntry
                    active={false}
                    href='https://github.com/PaulBlanche/frugal'
                >
                    Github ⧉
                </NavigationEntry>
            </nav>
        </div>
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
    return (
        <a
            class={cx(s.entry, active && s.entryActive)}
            href={active ? undefined : href}
        >
            {children}
        </a>
    );
}
