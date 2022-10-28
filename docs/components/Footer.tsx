/* @jsxRuntime automatic */
/* @jsxImportSource preact */

import { cx } from '../dep/frugal/styled.ts';

import * as s from './Footer.style.ts';
import { link } from '../styles/link.style.ts';

export function Footer() {
    return (
        <footer class={cx(s.footer)}>
            <div class={cx(s.footerContainer)}>
                <p>
                    Source code at{' '}
                    <a
                        class={cx(link)}
                        href='https://github.com/PaulBlanche/frugal'
                    >
                        Github
                    </a>
                </p>
            </div>
        </footer>
    );
}
