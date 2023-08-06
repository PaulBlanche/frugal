import { clsx } from "$dep/frugal/doc/dep/clsx.ts";
import { CodeBlock } from "$dep/frugal/doc/src/components/CodeBlock.tsx";
import hero from "./Hero.module.css";

export function Hero() {
    return (
        <div class={clsx(hero["hero"])}>
            <h1 class={clsx(hero["title"])}>
                <span class={clsx(hero["highlight"])}>Frugal</span>
            </h1>
            <p class={clsx(hero["tagline"])}>A web framework that wastes not</p>
        </div>
    );
}
