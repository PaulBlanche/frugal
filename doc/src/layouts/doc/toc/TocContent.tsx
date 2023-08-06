import { Head, usePathname } from "$dep/frugal/runtime/preact.client.ts";
import { clsx } from "$dep/clsx.ts";

import toccontent from "./TocContent.module.css";
import { entryHref, entryMatchHref, TocHierarchy } from "../../../toc.ts";

type TocContentProps = {
    hierarchies: TocHierarchy[];
};

export function TocContent({ hierarchies }: TocContentProps) {
    return (
        <ul class={toccontent["toc-list"]}>
            {hierarchies.map((child) => {
                return (
                    <li class={toccontent["toc-item"]}>
                        <TocNode hierarchy={child} />
                    </li>
                );
            })}
        </ul>
    );
}

type TocNodeProps = {
    hierarchy: TocHierarchy;
};

function TocNode({ hierarchy }: TocNodeProps) {
    const pathname = usePathname();

    const entry = hierarchy.entry;
    const children = Object.values(hierarchy.children);

    const isActive = entryMatchHref(entry, pathname);
    const href = entryHref(entry);
    const isLinkable = entry.file || entry.link;

    return (
        <>
            {isActive && (
                <Head>
                    <title>{entry.title}</title>
                </Head>
            )}
            {isLinkable && !isActive
                ? (
                    <a class={clsx(toccontent["toc-link"])} href={href}>
                        {entry.title}
                    </a>
                )
                : isLinkable
                ? (
                    <span class={clsx(toccontent["toc-link"], toccontent["toc-link-active"])}>
                        {entry.title}
                    </span>
                )
                : (
                    <span class={clsx(toccontent["toc-inactive-link"])}>
                        {entry.title}
                    </span>
                )}

            {children.length > 0 && <TocContent hierarchies={children} />}
        </>
    );
}
