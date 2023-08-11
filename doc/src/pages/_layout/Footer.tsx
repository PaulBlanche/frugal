import { clsx } from "$dep/clsx.ts";

import footer from "./Footer.module.css";
import link from "../../styles/link.module.css";

type FooterProps = {
    class?: string;
};

export function Footer({ class: className }: FooterProps) {
    return (
        <footer class={clsx(footer["footer"], className)}>
            <div class={clsx(footer["footer-container"])}>
                <p>
                    Made with 💛 by{" "}
                    <a class={clsx(link["link"])} href="https://piaille.fr/@whiteshoulders">whiteshoulders</a>
                </p>
            </div>
        </footer>
    );
}
