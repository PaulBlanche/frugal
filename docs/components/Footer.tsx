/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import { cx } from '../dep/frugal/styled.ts';

import * as s from './Footer.style.ts';
import { link } from '../styles/link.style.ts';

export function Footer() {
    return (
        <footer class={cx(s.footer)}>
            <div class={cx(s.footerContainer)}>
                <p>
                    Powered by{' '}
                    <a
                        class={cx(link)}
                        href='https://github.com/PaulBlanche/frugal'
                    >
                        frugal
                    </a>
                </p>
            </div>
        </footer>
    );
}
