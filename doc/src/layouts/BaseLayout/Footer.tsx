/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import { clsx } from "$dep/clsx.ts";

// @deno-types="frugal/css-module.d.ts"
import footer from "./Footer.module.css";
// @deno-types="frugal/css-module.d.ts"
import link from "../../styles/link.module.css";

export const FOOTER_CLASSNAME = "mobile-toggle-footer";

export function Footer() {
  return (
    <footer class={clsx(footer["footer"], FOOTER_CLASSNAME)}>
      <div class={clsx(footer["footer-container"])}>
        <p>
          <a
            class={clsx(link["link"])}
            href="https://github.com/PaulBlanche/frugal"
          >
            Source code on GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
