export function isInternalUrl(url: URL) {
    const rootURL = new URL('/', document.baseURI);
    return url.href.startsWith(rootURL.href);
}

export function getClosestParentNavigableAnchor(
    target: EventTarget,
): HTMLAnchorElement | undefined {
    if (target instanceof Element) {
        const anchor = target.closest<HTMLAnchorElement>(
            'a[href]:not([target^=_]:not([download])',
        );
        if (anchor !== null) {
            return anchor;
        }
    }
}

export function getAnchorUrl(anchor: HTMLAnchorElement) {
    return new URL(anchor.href, document.baseURI);
}
