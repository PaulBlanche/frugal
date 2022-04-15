/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import * as hooks from 'preact/hooks';
import { Form, submitForm, validateForm } from './Form.ts';

export type FormProps = {
    initialForm: Form;
};

export function Form({ initialForm }: FormProps) {
    const [state, setState] = hooks.useState(initialForm);

    return (
        <form
            encType='multipart/form-data'
            method='POST'
            onSubmit={(event) => {
                event.preventDefault();
                setState((state) => {
                    const validatedForm = validateForm(state);
                    if (validatedForm.isValid) {
                        submitForm(validatedForm).then(setState);
                    }
                    return validatedForm;
                });
            }}
        >
            <label for='text'>Text:</label>
            <input
                id='text'
                type='text'
                value={state.value.text}
                onInput={(event) => {
                    setState((form) =>
                        validateForm({
                            ...form,
                            value: {
                                text: event.currentTarget.value,
                            },
                        })
                    );
                }}
                onBlur={() => {
                    setState((form) => validateForm(form));
                }}
            />
            {state.errors.text.map((error) => {
                return <p>{error}</p>;
            })}
        </form>
    );
}
