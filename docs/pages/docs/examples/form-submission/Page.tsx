/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { PageProps } from '../../../../dep/frugal/preact.server.ts';
import { useData } from '../../../../dep/frugal/preact.client.ts';
import { cx } from '../../../../dep/frugal/styled.ts';

import { DocLayout } from '../../_layout/DocLayout.tsx';
import { Callout } from './Callout.tsx';
import { ExampleForm } from './ExampleForm.island.tsx';
import { Data } from './type.ts';
import { markdown } from '../../Page.style.ts';

export function Page(props: PageProps) {
    const { submitted, toc } = useData<Data>();

    return (
        <DocLayout toc={toc} {...props}>
            <div class={cx(markdown)}>
                <h1>Form sumbission</h1>

                <p>
                    This is a form working both server-side and client-side:
                    <ul>
                        <li>
                            With JavaScript is activated, validation is done
                            client-side and the submission is done only if the
                            form is valid.
                        </li>
                        <li>
                            With JavaScript is deactivated, the form is
                            submitted each times and the server runs the
                            validation logic.
                        </li>
                    </ul>
                </p>

                <p>
                    This form is also CSRF protected. For the purpose of the
                    example, the CSRF token is visible in the form. Try changing
                    it before submitting the form.
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

                {submitted && <Callout>Form submitted successfully</Callout>}
            </div>
        </DocLayout>
    );
}
