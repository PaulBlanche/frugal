import { clsx } from "$dep/clsx.ts";
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
