/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as hooks from 'preact/hooks';
import * as signal from 'preact/signals';

export type CounterProps = {
    title: string;
};

const count = new signal.Signal(0);

export function Counter({ title }: CounterProps) {
    return (
        <div>
            <h2>{title}</h2>
            <div>value: {String(count)}</div>
            <button onClick={() => count.value += 1}>Increment</button>
        </div>
    );
}
