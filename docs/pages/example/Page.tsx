/* @jsxRuntime automatic */
/* @jsxImportSource preact */

import { cx } from '../../dep/frugal/styled.ts';
import { PageProps } from '../../dep/frugal/preact.server.ts';
import { useData } from '../../dep/frugal/preact.client.ts';

import { BaseLayout } from '../../layout/BaseLayout/mod.tsx';
import { Callout } from './Callout.tsx';
import * as s from './Page.style.ts';
import { ExampleForm } from './ExampleForm.island.tsx';
import { RefreshButton } from './RefreshButton.island.tsx';
import { App } from '../App.tsx';
import { Data } from './type.ts';

export function Page(props: PageProps) {
    const { submitted, serverNow } = useData<Data>();

    return (
        <App {...props}>
            <BaseLayout>
                <main class={cx(s.mainContainer)}>
                    <h2>Static refreshable page</h2>

                    <p>This page is an example of a static page.</p>

                    <p>
                        The whole page was generated at build time the{' '}
                        {serverNow.toLocaleDateString('en')} at{' '}
                        {serverNow.toLocaleTimeString('en')} .
                    </p>

                    <p>
                        The page can be refreshed by click this button :{' '}
                        <RefreshButton />. The server will refresh the page (and
                        the build time generation date will change)
                    </p>

                    <h2>Form example</h2>

                    <p>
                    </p>

                    <p>
                        This is a form working both server-side and client-side.
                        Try to fill it and submit with JavaScript activated and
                        deactivated.
                    </p>

                    <ExampleForm />

                    {submitted && (
                        <>
                            <p>
                                You last submitted the form with the following
                                values:
                            </p>
                            <ul>
                                <li>Age: {submitted.age}</li>
                                <li>
                                    Username: {submitted.username}
                                </li>
                            </ul>
                        </>
                    )}
                </main>

                {submitted && <Callout>Form submitted successfully</Callout>}
            </BaseLayout>
        </App>
    );
}
