interface Spy<PARAMS extends any[], RESULT> {
  __isSpy: true;
  (...params: PARAMS): RESULT;
  calls: { params: PARAMS; result: RESULT }[];
}

function isSpy<PARAMS extends any[], RESULT>(
  fn: (...params: PARAMS) => RESULT,
): fn is Spy<PARAMS, RESULT> {
  return (fn as any).__isSpy;
}

export function spy<PARAMS extends any[], RESULT>(
  fn: (...params: PARAMS) => RESULT,
): Spy<PARAMS, RESULT> {
  const calls: { params: PARAMS; result: RESULT }[] = [];

  const callable = ((...params: PARAMS): RESULT => {
    const result = fn(...params);
    calls.push({ params, result });
    return result;
  }) as Spy<PARAMS, RESULT>;

  callable.calls = calls;
  callable.__isSpy = true;

  return callable;
}

export function asSpy<PARAMS extends any[], RESULT>(
  fn: (...params: PARAMS) => RESULT,
): Spy<PARAMS, RESULT> {
  if (isSpy(fn)) {
    return fn;
  }
  throw Error(`function ${fn.name} is not a spy`);
}
