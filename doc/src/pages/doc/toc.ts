export type TocEntry =
    & { slug: string; title: string }
    & ({ file: string; link?: undefined } | { file?: undefined; link: string });

export type TocVersion = { version: string; variables: Record<string, string>; entries: TocEntry[] };

export type Toc = Record<string, TocVersion>;

export type TocHierarchy = {
    segment: string;
    entry: TocEntry;
    children: Record<string, TocHierarchy>;
};

export function getHierarchy(toc: Toc, version: string) {
    const hierarchy = { segment: "", children: {} } as TocHierarchy;

    const tocVersion = toc[version];

    for (const entry of tocVersion.entries) {
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

let TOC_PROMISE: Promise<string>;

export async function getToc(resolve: (path: string) => string): Promise<Toc> {
    if (TOC_PROMISE === undefined) {
        TOC_PROMISE = Deno.readTextFile(resolve(`./src/contents/doc/toc.json`));
    }

    const tocContent = await TOC_PROMISE;
    return JSON.parse(tocContent);
}

export function latest(toc: Toc) {
    let latest = "0.0.0";
    Object.keys(toc).forEach((version) => {
        const v = version.split(".");
        const l = latest.split(".");
        if (Number(v[0]) > Number(l[0])) {
            latest = version;
        }
        if (Number(v[0]) === Number(l[0])) {
            if (Number(v[1]) > Number(l[1])) {
                latest = version;
            }
            if (Number(v[1]) === Number(l[1])) {
                if (Number(v[2]) > Number(l[2])) {
                    latest = version;
                }
            }
        }
    });

    return latest;
}

export function entryHref(entry: TocEntry, version: string) {
    if (entry.link) {
        return entry.link;
    }
    return `/doc@${version}/${entry.slug}`;
}

export function entryMatchHref(entry: TocEntry, version: string, href: string) {
    const ownHref = entryHref(entry, version);
    if (ownHref === `/doc@${version}/introduction` && href === `/doc@${version}`) {
        return true;
    }
    return href === ownHref;
}

export function nextEntry(toc: Toc, version: string, href: string) {
    const versionToc = toc[version];
    const currentIndex = versionToc.entries.findIndex((entry) => entryMatchHref(entry, version, href));

    let nextIndex = currentIndex + 1;
    while (nextIndex < versionToc.entries.length) {
        if (versionToc.entries[nextIndex].file || versionToc.entries[nextIndex].link) {
            return versionToc.entries[nextIndex];
        }
        nextIndex += 1;
    }
}

export function previousEntry(toc: Toc, version: string, href: string) {
    const versionToc = toc[version];
    const currentIndex = versionToc.entries.findIndex((entry) => entryMatchHref(entry, version, href));

    let previousIndex = currentIndex - 1;
    while (previousIndex > -1) {
        if (versionToc.entries[previousIndex].file || versionToc.entries[previousIndex].link) {
            return versionToc.entries[previousIndex];
        }
        previousIndex -= 1;
    }
}
