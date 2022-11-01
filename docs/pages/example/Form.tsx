/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as hooks from 'preact/hooks';
import { cx } from '../../dep/frugal/styled.ts';
import { useData } from '../../dep/frugal/preact.client.ts';
import { Session } from '../../dep/frugal/client_session.ts';

import { Form, submitForm, validateForm } from './Form.ts';
import { Data } from './type.ts';
import * as s from './Form.style.ts';

export function Form() {
    const { form: initialForm } = useData<Data>();

    const [state, setState] = hooks.useState(initialForm);
    const isServer = typeof window.document === 'undefined';
    const [submitted, setSubmitted] = hooks.useState({
        age: initialForm.age.value,
        username: initialForm.username.value,
    });

    const now = new Date();

    return (
        <div class={cx(s.formWrapper)} id='scroll-anchor'>
            <p>
                This component rendered{' '}
                {isServer ? 'on the server' : 'in the browser'} the{' '}
                {now.toLocaleDateString('en')} at{' '}
                {now.toLocaleTimeString('end')}.
            </p>

            <button
                onClick={() => {
                    Session.getInstance().navigate(
                        new URL('?force_refresh=refresh_key', location.href),
                    );
                }}
            >
                Refresh Page
            </button>

            {state.submitCount !== 0 && (
                <>
                    <p>
                        You last submitted the form with the following values:
                    </p>
                    <ul>
                        <li>Age: {submitted.age}</li>
                        <li>Username: {submitted.username}</li>
                    </ul>
                </>
            )}

            <form
                class={cx(s.form)}
                encType='multipart/form-data'
                method='POST'
                action='#scroll-anchor'
                onSubmit={(event) => {
                    event.preventDefault();
                    setState((state) => {
                        const validatedForm = validateForm(state);
                        if (validatedForm.isValid) {
                            submitForm(validatedForm).then((form) => {
                                setState(form);
                                setSubmitted({
                                    age: form.age.value,
                                    username: form.username.value,
                                });
                            });
                        }
                        return validatedForm;
                    });
                }}
            >
                <div class={cx(s.field)}>
                    <label for='age'>Age</label>
                    <input
                        class={cx(s.input)}
                        type='text'
                        id='age'
                        name='age'
                        value={String(state.age.value)}
                        onInput={(event) => {
                            setState((form) =>
                                validateForm({
                                    ...form,
                                    age: {
                                        ...form.age,
                                        value: event.currentTarget.value,
                                    },
                                })
                            );
                        }}
                        onBlur={() => {
                            setState((form) =>
                                validateForm({
                                    ...form,
                                    age: {
                                        ...form.age,
                                        touched: true,
                                    },
                                })
                            );
                        }}
                    />
                    {state.age.touched && state.age.errors.length > 0 && (
                        <p class={cx(s.error)}>{state.age.errors[0]}</p>
                    )}
                </div>
                <div class={cx(s.field)}>
                    <label for='username'>Username</label>
                    <input
                        class={cx(s.input)}
                        type='text'
                        id='username'
                        name='username'
                        value={String(state.username.value)}
                        onInput={(event) => {
                            setState((form) =>
                                validateForm({
                                    ...form,
                                    username: {
                                        ...form.username,
                                        value: event.currentTarget.value,
                                    },
                                })
                            );
                        }}
                        onBlur={() => {
                            setState((form) =>
                                validateForm({
                                    ...form,
                                    username: {
                                        ...form.username,
                                        touched: true,
                                    },
                                })
                            );
                        }}
                    />
                    {state.username.touched &&
                        state.username.errors.length > 0 && (
                        <p class={cx(s.error)}>{state.username.errors[0]}</p>
                    )}
                </div>
                <div class={cx(s.submitWrapper)}>
                    {state.success && (
                        <p class={cx(s.success)}>{state.success}</p>
                    )}
                    <button class={cx(s.submit)}>Submit</button>
                </div>
            </form>
        </div>
    );
}
