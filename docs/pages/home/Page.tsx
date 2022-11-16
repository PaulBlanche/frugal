/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { cx } from '../../dep/frugal/styled.ts';
import { BaseLayout } from '../../layout/BaseLayout/mod.tsx';

import { HeroHeader } from './HeroHeader.tsx';
import * as s from './Page.style.ts';
import { link } from '../../styles/link.style.ts';
import { App } from '../App.tsx';
import { PageProps } from '../../dep/frugal/preact.server.ts';

export function Page(props: PageProps) {
    return (
        <App {...props}>
            <BaseLayout>
                <HeroHeader />
                <main class={cx(s.mainContainer)}>
                    <p>
                        Frugal is a web framework with resource sparing in mind.
                        Send the right amount of js, keep what's meant to be
                        static static, offload to the server when needed.
                    </p>
                    <ul>
                        <li>
                            <strong>
                                Static pages rendered at build time
                            </strong>: by default frugal produces static html.
                        </li>
                        <li>
                            <strong>
                                Server side pages render
                            </strong>{' '}
                            at request time
                        </li>
                        <li>
                            <strong>
                                Bring your own framework
                            </strong>: frugal works with any UI framework able
                            to compile to html
                        </li>
                        <li>
                            <strong>
                                Manual partial hydration
                            </strong>{' '}
                            for interactive island in pages of you use{' '}
                            <a class={cx(link)} href='https://preactjs.com/'>
                                Preact
                            </a>
                        </li>
                        <li>
                            <strong>
                                Form submission client-side or server-side
                            </strong>{' '}
                            for both static and dynamic pages
                        </li>
                        <li>
                            <strong>Incremental build</strong>: if both data and
                            code did not change, the page is not rebuilt
                        </li>
                        <li>
                            <strong>Client session</strong>: get an SPA user
                            experience with a MPA codebase
                        </li>
                    </ul>
                    <p>
                        Learn more about{' '}
                        <a class={cx(link)} href='/docs'>
                            the philosophy frugal embraces
                        </a>, or{' '}
                        <a class={cx(link)} href='/example'>
                            see frugal in action
                        </a>
                    </p>
                </main>
            </BaseLayout>
        </App>
    );
}
