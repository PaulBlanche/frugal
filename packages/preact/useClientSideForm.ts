import * as preact from 'preact';
import * as hooks from 'preact/hooks';

import { Form, FormState, FormValue } from './Form.ts';

export function useClientSideForm<VALUE extends FormValue>(
    formState: FormState<VALUE>,
    fromState: (formState: FormState<VALUE>) => Form<VALUE>,
): [
    Form<VALUE>,
    (event: preact.JSX.TargetedEvent<HTMLFormElement, Event>) => void,
] {
    const { current: form } = hooks.useRef(fromState(formState));
    const [_state, setState] = hooks.useState(0);

    hooks.useEffect(() => {
        form.addListener(listener);

        return () => {
            form.removeListener(listener);
        };
    });

    return [form, onSubmit];

    async function onSubmit(
        event: preact.JSX.TargetedEvent<HTMLFormElement, Event>,
    ) {
        event.preventDefault();
        const formElement = event.currentTarget;
        await form.submit(formElement);
    }

    function listener() {
        setState((state) => state + 1);
    }
}
