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

export function getUrl(path: string) {
    return new URL(path, document.baseURI);
}

const readyStateOrder: Record<DocumentReadyState, number> = {
    'loading': 0,
    'interactive': 1,
    'complete': 2,
};

declare global {
    type FrugalReadyStateChangeEvent = CustomEvent<
        { readystate: DocumentReadyState }
    >;

    interface WindowEventMap {
        'frugal:readystatechange': FrugalReadyStateChangeEvent;
    }
}

export function onReadyStateChange(
    readyState: DocumentReadyState,
    callback: () => void,
) {
    if (typeof document === 'undefined') {
        return;
    }

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
