/**
 * @template T
 * @param {AsyncIterable<T>} stream
 * @param {number} interval
 */
export function* debounce(stream, interval) {
    /** @type {boolean | undefined} */
    let first; // is this first event?  will pass
    /** @type {T[]} */
    let buffer = []; // the last event raised
    /** @type {Promise<T[]>} */
    let deferred; // deferred promise instance
    /** @type {(value: T[]) => void} */
    let resolve; // resolve method for deferred promise

    /** @param {boolean} isFirst */
    function reset(isFirst) {
        first = isFirst;
        buffer.length = 0;
        deferred = new Promise((r) => (resolve = r));
    }

    function passEvent() {
        // if no event to pass
        if (buffer.length === 0) {
            first = true; // reset first state
            return;
        }

        const eventsToEmit = [...buffer];
        const res = resolve;
        reset(false);
        setTimeout(passEvent, interval);
        res(eventsToEmit);
    }

    reset(true);
    destreamify(stream, (event) => {
        buffer.push(event);
        if (first) {
            passEvent();
        }
    });

    while (true) {
        // @ts-expect-error: deferred is definitly assigned before in `reset` call
        yield deferred;
    }
}

/**
 * @template T
 * @param {AsyncIterable<T>} stream
 * @param {(event: T) => void} callback
 */
async function destreamify(stream, callback) {
    for await (let event of stream) {
        callback(event);
    }
}

/**
 * @template T
 * @param {AsyncIterable<T>[]} iterable
 * @returns {AsyncIterable<T>}
 */
export async function* combine(iterable) {
    const asyncIterators = Array.from(iterable, (o) => o[Symbol.asyncIterator]());
    const results = [];
    let count = asyncIterators.length;
    const never = new Promise(() => {});

    /**
     * @param {AsyncIterator<T>} asyncIterator
     * @param {number} index
     * @returns
     */
    function getNext(asyncIterator, index) {
        return asyncIterator.next().then((result) => ({
            index,
            result,
        }));
    }

    const nextPromises = asyncIterators.map(getNext);

    try {
        while (count) {
            const { index, result } = await Promise.race(nextPromises);
            if (result.done) {
                nextPromises[index] = never;
                results[index] = result.value;
                count--;
            } else {
                nextPromises[index] = getNext(asyncIterators[index], index);
                yield result.value;
            }
        }
    } finally {
        for (const [index, iterator] of asyncIterators.entries())
            if (nextPromises[index] != never && iterator.return != null) {
                iterator.return();
            }
    }
    return results;
}
