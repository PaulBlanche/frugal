import * as signal from 'preact/signals';
import * as hooks from 'preact/hooks';

const MATCHERS: Record<
    string,
    { matches: signal.Signal<boolean>; effect: () => () => void; count: number }
> = {};

function createMatchMediaSignal(query: string) {
    const matcher = matchMedia(query);
    const matches = signal.signal(matcher.matches);

    let count = 0;

    return { matches, effect, count };

    function effect() {
        if (count === 0) {
            matcher.addEventListener('change', listener);
        }

        return () => {
            count--;
            if (count <= 0) {
                matcher.removeEventListener('change', listener);
                delete MATCHERS[query];
            }
        };
    }

    function listener(event: MediaQueryListEvent) {
        matches.value = event.matches;
    }
}

function getMatchMediaSignal(query: string) {
    if (!(query in MATCHERS)) {
        MATCHERS[query] = createMatchMediaSignal(query);
    }

    return MATCHERS[query];
}

export function useMatchMedia(query: string) {
    if (typeof document === 'undefined') {
        return signal.signal(false);
    }

    const matcher = getMatchMediaSignal(query);

    hooks.useEffect(matcher.effect, []);

    return matcher.matches;
}
