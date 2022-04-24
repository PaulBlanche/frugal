/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import { Navigation } from './Navigation.tsx';
import { Footer } from './Footer.tsx';

type LayoutProps = {
    children: preact.ComponentChildren;
};

export function Layout({ children }: LayoutProps) {
    return (
        <>
            <Navigation />
            {children}
            <Footer />
        </>
    );
}
