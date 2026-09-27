/** Whether a value is a thenable, from this realm's Promise or any other. */
export const isPromiseLike = <TValue>(
  value: TValue | PromiseLike<TValue>,
): value is PromiseLike<TValue> =>
  typeof value === "object" &&
  value !== null &&
  "then" in value &&
  typeof value.then === "function";
