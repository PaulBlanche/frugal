import { clsx } from "$dep/frugal/doc/dep/clsx.ts";
import link from "../../../styles/link.module.css";

type LinkProps = {
    text: string;
} & preact.JSX.IntrinsicElements["a"];

export function Link({ class: className, text, ...props }: LinkProps) {
    return (
        <a
            {...props}
            dangerouslySetInnerHTML={{ __html: text }}
            class={clsx(link["link"])}
            rel={!hasProtocol(props.href) ? props.rel : `${props.rel ?? ""} noopener noreferrer`.trim()}
        />
    );
}

const PROTOCOL_REGEXP = /^(?:[a-z+]+:)?\/\//;
export function hasProtocol(
    href: LinkProps["href"],
) {
    const hrefValue = typeof href === "string" ? href : href?.peek();
    if (hrefValue === undefined) {
        return false;
    }
    return PROTOCOL_REGEXP.test(hrefValue);
}
