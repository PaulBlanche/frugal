import * as signal from 'preact/signals';
import * as hooks from 'preact/hooks';

export function useSignal<T>(s: signal.Signal<T>) {
    const [value, setValue] = hooks.useState(s.value);

    hooks.useEffect(() => {
        return signal.effect(() => {
            setValue(s.value);
        });
    }, []);

    return value;
}
