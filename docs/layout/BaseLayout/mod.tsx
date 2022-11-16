/* @jsxRuntime automatic */
/* @jsxImportSource preact */

import { Navigation } from './Navigation.tsx';
import { Footer } from './Footer.tsx';

type LayoutProps = {
    children: preact.ComponentChildren;
};

export function BaseLayout({ children }: LayoutProps) {
    return (
        <>
            <Navigation />
            {children}
            <Footer />
        </>
    );
}
