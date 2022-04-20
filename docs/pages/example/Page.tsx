/** @jsxImportSource preact */
import { cx } from '../../dep/frugal/styled.ts';
import { Layout } from '../../components/Layout.tsx';

import * as s from './Page.style.ts';
import { Form } from './Form.island.tsx';

export function Page() {
    const now = new Date();
    return (
        <Layout>
            <main class={cx(s.mainContainer)}>
                <p>This page is an example of a static page.</p>
                <p>
                    The whole page was generated at build time the{' '}
                    {now.toLocaleDateString('en')} at{' '}
                    {now.toLocaleTimeString('end')}.
                </p>
                <p>
                    This is a form working both server-side and client-side. Try
                    to fill it and submit with javascript activated and
                    deactivated.
                </p>
                <Form />
            </main>
        </Layout>
    );
}
