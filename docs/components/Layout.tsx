/* @jsxRuntime automatic */
/* @jsxImportSource preact */

import { Navigation } from './Navigation.tsx';
import { Footer } from './Footer.tsx';
import { Toc } from '../toc.ts';

type LayoutProps = {
    toc?: Toc;
    children: preact.ComponentChildren;
};

export function Layout({ children, toc }: LayoutProps) {
    return (
        <>
            <Navigation toc={toc} />
            {children}
            <Footer />
        </>
    );
}
