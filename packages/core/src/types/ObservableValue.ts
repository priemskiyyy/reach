/**
 * A readable value with change notifications. `get` answers the same object
 * until the value changes, and `subscribe` never calls back at once; each call
 * is its own registration with its own unsubscriber.
 *
 * @example
 * ```ts
 * const stop = reach.state.subscribe(() => console.log(reach.state.get().revision));
 * ```
 */
export type ObservableValue<TValue> = {
  get: () => TValue;
  subscribe: (listener: () => void) => () => void;
};
