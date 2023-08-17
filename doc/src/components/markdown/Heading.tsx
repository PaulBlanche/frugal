/* @jsxRuntime automatic */
/* @jsxImportSource preact */
import * as preact from "preact";
import { clsx } from "$dep/clsx.ts";

import * as icons from "../../glyphs/icons/mod.ts";
import heading from "./Heading.module.css";

type HeadingProps = {
    level: 1 | 2 | 3 | 4 | 5 | 6;
    text: string;
} & preact.JSX.IntrinsicElements["h1"];

export function Heading({ level, text, id, ...props }: HeadingProps) {
    const Heading: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" = `h${level}`;
    return (
        <Heading {...props} class={clsx(props.class, heading["heading"])}>
            <span id={id}></span>
            {id && (
                <>
                    {" "}
                    <a
                        href={`#${id}`}
                        aria-hidden="true"
                        tabIndex={-1}
                        class={heading["anchor"]}
                    >
                        <icons.Link class={heading["icon"]} height="15px" />
                    </a>
                </>
            )}
            <span dangerouslySetInnerHTML={{ __html: text }} />
        </Heading>
    );
}
