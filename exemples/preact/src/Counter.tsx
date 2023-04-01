import * as preact from "preact";
import { signal } from "@preact/signals";

//@deno-types=frugal/css-module.d.ts
import counter from "./Counter.module.css";

export type CounterProps = {
  children: string;
};

const count = signal(0);

export function Counter({ children }: CounterProps) {
  const add = () => count.value++;
  const subtract = () => count.value--;

  return (
    <>
      <div class={`${counter["counter"]} counter`}>
        <button onClick={subtract}>-</button>
        <pre>{count}</pre>
        <button onClick={add}>+</button>
      </div>
      <div class={`${counter["counter-message"]} counter-message`}>
        {children}
      </div>
    </>
  );
}
