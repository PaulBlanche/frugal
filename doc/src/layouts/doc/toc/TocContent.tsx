import { Head, usePathname } from "$dep/frugal/runtime/preact.client.ts";
import { clsx } from "$dep/clsx.ts";

import toccontent from "./TocContent.module.css";
import { entryHref, entryMatchHref, TocHierarchy } from "../../../toc.ts";

type TocContentProps = {
    version: string;
    hierarchies: TocHierarchy[];
};

export function TocContent({ hierarchies, version }: TocContentProps) {
    return (
        <ul class={toccontent["toc-list"]}>
            {hierarchies.map((child) => {
                return (
                    <li class={toccontent["toc-item"]}>
                        <TocNode hierarchy={child} version={version} />
                    </li>
                );
            })}
        </ul>
    );
}

type TocNodeProps = {
    version: string;
    hierarchy: TocHierarchy;
};

function TocNode({ hierarchy, version }: TocNodeProps) {
    const pathname = usePathname();

    const entry = hierarchy.entry;
    const children = Object.values(hierarchy.children);

    const isActive = entryMatchHref(entry, version, pathname);
    const href = entryHref(entry, version);
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

            {children.length > 0 && <TocContent hierarchies={children} version={version} />}
        </>
    );
}
