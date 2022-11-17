/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as hooks from 'preact/hooks';
import { PageProps } from '../../../../dep/frugal/preact.server.ts';
import { useData } from '../../../../dep/frugal/preact.client.ts';
import { cx } from '../../../../dep/frugal/styled.ts';

import { Data } from './type.ts';
import { DocLayout } from '../../_layout/DocLayout.tsx';
import { Counter } from './Counter.island.tsx';
import { markdown } from '../../Page.style.ts';

export function Page(props: PageProps) {
    const { serverNow, phase, toc } = useData<Data>();
    const id = hooks.useId();

    return (
        <DocLayout toc={toc} {...props}>
            <form id={id}>
                <input
                    type='hidden'
                    name='force_refresh'
                    value='refresh_key'
                />
            </form>

            <div class={cx(markdown)}>
                <h1>Static refreshable page</h1>

                <p>
                    This page is an example of a static page. The whole page was
                    generated at{' '}
                    {phase === 'build' ? 'build time' : 'refresh time'} the{' '}
                    {serverNow.toLocaleDateString('en')} at{' '}
                    {serverNow.toLocaleTimeString('en')} .
                </p>

                <p>
                    The page can be refreshed by clicking this button :{' '}
                    <button form={id}>Force refresh</button>
                </p>
                <p>
                    The server will refresh the page (and the generation date
                    will change)
                </p>

                <h2>Islands</h2>

                <p>
                    The page is static, but you can add islands of
                    interactivity, like this counter :
                </p>

                <Counter />

                <p>
                    The state of the counter is kept in JavaScript. If you
                    reload the page (with F5 for example), the state will be
                    lost. But thanks to{' '}
                    <a href='/docs/api/06-client-session'>
                        client session
                    </a>{' '}
                    and{' '}
                    <a href='https://preactjs.com/guide/v10/signals/'>
                        preact signals
                    </a>{' '}
                    any navigation or form submission will preserve the
                    javascript context and keep the state.
                </p>

                <p>
                    Try to click the <button form={id}>Force refresh</button>
                    {' '}
                    with a counter not in its initial state (or navigating to
                    another page then back here). The page is refreshed with a
                    new server-side generated html, but the state of the
                    hydrated counter is preserved.
                </p>
            </div>
        </DocLayout>
    );
}
