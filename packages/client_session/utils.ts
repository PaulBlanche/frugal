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

const readyStateOrder: Record<DocumentReadyState, number> = {
    'loading': 0,
    'interactive': 1,
    'complete': 2,
};

declare global {
    interface WindowEventMap {
        'frugal:readystatechange': CustomEvent<
            { readystate: DocumentReadyState }
        >;
    }
}

export function onReadyStateChange(
    readyState: DocumentReadyState,
    callback: () => void,
) {
    if (readyStateOrder[document.readyState] >= readyStateOrder[readyState]) {
        callback();
    } else {
        document.addEventListener('readystatechange', () => {
            if (document.readyState === readyState) {
                callback();
            }
        });
    }

    addEventListener(
        'frugal:readystatechange',
        (event) => {
            if (event.detail.readystate === readyState) {
                callback();
            }
        },
    );
}
