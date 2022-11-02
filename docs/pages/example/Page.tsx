/* @jsxRuntime automatic */
/* @jsxImportSource preact */

import { cx } from '../../dep/frugal/styled.ts';
import { PageProps } from '../../dep/frugal/preact.server.ts';
import { useData } from '../../dep/frugal/preact.client.ts';

import { Layout } from '../../components/Layout.tsx';
import * as s from './Page.style.ts';
import { Form } from './Form.island.tsx';
import { RefreshButton } from './RefreshButton.island.tsx';
import { App } from '../App.tsx';
import { Data } from './type.ts';

export function Page(props: PageProps) {
    const data = useData<Data>();

    return (
        <App {...props}>
            <Layout>
                <main class={cx(s.mainContainer)}>
                    <p>This page is an example of a static page.</p>

                    <p>
                        The whole page was generated at build time the{' '}
                        {data.serverNow.toLocaleDateString('en')} at{' '}
                        {data.serverNow.toLocaleTimeString('end')}.
                    </p>

                    <p>
                        The page can be refreshed by click this button :{' '}
                        <RefreshButton />
                    </p>

                    <p>
                        The server will refresh the page (and the build time
                        generation date will change)
                    </p>

                    <p>
                        This is a form working both server-side and client-side.
                        Try to fill it and submit with javascript activated and
                        deactivated.
                    </p>
                    <Form />
                </main>
            </Layout>
        </App>
    );
}
