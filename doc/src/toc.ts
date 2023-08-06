export type TocEntry =
    & { slug: string; title: string; version: string }
    & ({ file: string; link?: undefined } | { file?: undefined; link: string });

export type Toc = { variables: Record<string, string>; entries: TocEntry[] };

export type TocHierarchy = {
    segment: string;
    entry: TocEntry;
    children: Record<string, TocHierarchy>;
};

export function getHierarchy(toc: Toc) {
    const hierarchy = { segment: "", children: {} } as TocHierarchy;

    for (const entry of toc.entries) {
        const segments = entry.slug.split("/");
        let current = hierarchy;
        for (const segment of segments) {
            if (!(segment in current.children)) {
                current.children[segment] = { segment, children: {} } as TocHierarchy;
            }

            current = current.children[segment];
        }

        current.entry = entry;
    }

    Object.values(hierarchy.children).forEach((child) => validate(child));

    return hierarchy;
}

function validate(hierarchy: TocHierarchy, current: string[] = []) {
    if (hierarchy.entry === undefined) {
        throw Error(`Toc slug ${current.join("/")}/${hierarchy.segment} has no entry`);
    }
    Object.values(hierarchy.children).forEach((child) => validate(child, [hierarchy.segment]));
}

const TOC_PROMISE: { [version: string]: Promise<string> } = {};

export async function getToc(version: string, resolve: (path: string) => string): Promise<Toc> {
    if (!(version in TOC_PROMISE)) {
        TOC_PROMISE[version] = Deno.readTextFile(resolve(`./src/contents/doc/${version}-toc.json`));
    }

    const tocContent = await TOC_PROMISE[version];
    const { variables, entries }: Toc = JSON.parse(tocContent);
    return { variables, entries: entries.map((entry) => ({ ...entry, version })) };
}

export function entryHref(entry: TocEntry) {
    if (entry.link) {
        return entry.link;
    }
    return `/doc@${entry.version}/${entry.slug}`;
}

export function entryMatchHref(entry: TocEntry, href: string) {
    const ownHref = entryHref(entry);
    if (ownHref === `/doc@${entry.version}/introduction` && href === `/doc@${entry.version}`) {
        return true;
    }
    return href === ownHref;
}

export function nextEntry(toc: Toc, href: string) {
    const currentIndex = toc.entries.findIndex((entry) => entryMatchHref(entry, href));

    let nextIndex = currentIndex + 1;
    while (nextIndex < toc.entries.length) {
        if (toc.entries[nextIndex].file || toc.entries[nextIndex].link) {
            return toc.entries[nextIndex];
        }
        nextIndex += 1;
    }
}

export function previousEntry(toc: Toc, href: string) {
    const currentIndex = toc.entries.findIndex((entry) => entryMatchHref(entry, href));

    let previousIndex = currentIndex - 1;
    while (previousIndex > -1) {
        if (toc.entries[previousIndex].file || toc.entries[previousIndex].link) {
            return toc.entries[previousIndex];
        }
        previousIndex -= 1;
    }
}
