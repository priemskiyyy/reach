import { createAbortedError } from "src/utils/internal/errors/createAbortedError";

/** Waits for shared work on behalf of one caller: its signal ends its own wait, never the work. */
export const waitWithSignal = <TValue>(
  promise: Promise<TValue>,
  signal: AbortSignal | undefined,
  onAbort: () => void = () => {},
) => {
  if (signal === undefined) {
    return promise;
  }

  return new Promise<TValue>((resolve, reject) => {
    const handleAbort = () => {
      onAbort();
      reject(createAbortedError());
    };

    if (signal.aborted) {
      handleAbort();

      return;
    }

    signal.addEventListener("abort", handleAbort, { once: true });

    promise.then(
      (value) => {
        signal.removeEventListener("abort", handleAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener("abort", handleAbort);
        reject(error);
      },
    );
  });
};
