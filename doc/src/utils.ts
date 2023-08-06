type ThrottleOptions = {
  timeout: number;
  leading?: boolean;
  trailing?: boolean;
};

export function throttle<ARGS extends any[]>(
  callback: (...args: ARGS) => void,
  { timeout, leading = false, trailing = false }: ThrottleOptions,
): (...args: ARGS) => void {
  let timeoutHandle: number | undefined = undefined;
  let previous = 0;

  return (...args) => {
    const now = Date.now();

    if (!previous && !leading) {
      previous = now;
    }

    const remaining = timeout - (now - previous);

    if (remaining <= 0) {
      clearTimeout(timeoutHandle);
      timeoutHandle = undefined;
      previous = now;
      callback(...args);
    } else if (timeoutHandle === undefined && trailing) {
      timeoutHandle = setTimeout(() => {
        previous = Date.now();
        timeoutHandle = undefined;
        callback(...args);
      }, remaining);
    }
  };
}
