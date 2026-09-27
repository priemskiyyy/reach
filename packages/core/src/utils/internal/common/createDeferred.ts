export const createDeferred = <TValue = void>() => {
  let resolve: (value: TValue) => void = () => {};

  let reject: (reason: unknown) => void = () => {};

  const promise = new Promise<TValue>((fulfil, fail) => {
    resolve = fulfil;
    reject = fail;
  });

  // Attached before anyone can await: a rejection nobody waited for must not
  // surface as an unhandled rejection, and callers still see it.
  promise.catch(() => {});

  return { promise, resolve, reject };
};
