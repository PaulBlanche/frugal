/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { cx } from '../../dep/frugal/styled.ts';
import { useClientSideForm, useData } from '../../dep/frugal/preact.client.ts';

import { fromState } from './Form.ts';
import { Data } from './type.ts';
import * as s from './ExampleForm.style.ts';

export function ExampleForm() {
    const { form: formState } = useData<Data>();
    const [form, onSubmit] = useClientSideForm(formState, fromState);

    const isServer = typeof window.document === 'undefined';

    const now = new Date();

    return (
        <div class={cx(s.formWrapper)} id='scroll-anchor'>
            <p>
                This component rendered{' '}
                {isServer ? 'on the server' : 'in the browser'} the{' '}
                {now.toLocaleDateString('en')} at{' '}
                {now.toLocaleTimeString('en')}.
            </p>

            <form
                class={cx(s.form)}
                encType='multipart/form-data'
                method='POST'
                action='#scroll-anchor'
                onSubmit={onSubmit}
            >
                <div class={cx(s.field)}>
                    <label for='age'>Age</label>
                    <input
                        class={cx(s.input)}
                        type='text'
                        id='age'
                        name='age'
                        value={String(form.field('age').value)}
                        onInput={(event) => {
                            form.field('age').value = event.currentTarget.value;
                        }}
                        onBlur={() => {
                            form.field('age').touch();
                        }}
                    />
                    {form.field('age').touched &&
                        form.field('age').errors.length > 0 &&
                        (
                            <p class={cx(s.error)}>
                                {form.field('age').errors[0]}
                            </p>
                        )}
                </div>
                <div class={cx(s.field)}>
                    <label for='username'>Username</label>
                    <input
                        class={cx(s.input)}
                        type='text'
                        id='username'
                        name='username'
                        value={String(form.field('username').value)}
                        onInput={(event) => {
                            form.field('username').value =
                                event.currentTarget.value;
                        }}
                        onBlur={() => {
                            form.field('username').touch();
                        }}
                    />
                    {form.field('username').touched &&
                        form.field('username').errors.length > 0 &&
                        (
                            <p class={cx(s.error)}>
                                {form.field('username').errors[0]}
                            </p>
                        )}
                </div>
                <div class={cx(s.submitWrapper)}>
                    <button class={cx(s.submit)}>Submit</button>
                </div>
            </form>
        </div>
    );
}
