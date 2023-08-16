export function isInternalUrl(url: URL) {
    const rootURL = new URL("/", document.baseURI);
    return url.href.startsWith(rootURL.href);
}

export function isUrlForSameDocument(a: URL | string, b: URL | string) {
    const na = new URL(a);
    na.hash = "";
    const nb = new URL(b);
    nb.hash = "";
    return na.href === nb.href;
}

export function getClosestParentNavigableAnchor(
    target: EventTarget,
): HTMLAnchorElement | undefined {
    if (target instanceof Element) {
        const anchor = target.closest<HTMLAnchorElement>(
            "a[href]:not([target^=_]:not([download])",
        );
        if (anchor !== null) {
            return anchor;
        }
    }
}

export function getUrl(path: string) {
    return new URL(path, document.baseURI);
}
