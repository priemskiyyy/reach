import type { ObservableValue } from "@priemskiyyy/reach";
import type { ReadableValue } from "../../types/ReadableValue.js";
import { createSelection } from "../../utils/createSelection.js";

/**
 * Reads a selection of an observable through `current`. It subscribes only
 * once mounted, so the server and the hydrating render read the selection of
 * `serverSnapshot`, and it follows a new observable.
 *
 * @example
 * ```ts
 * const status = useSelectedValue(() => network.state, UNKNOWN_NETWORK_STATE, selectStatus, Object.is);
 * ```
 */
export const useSelectedValue = <TValue, TSelected>(
  observable: () => ObservableValue<TValue>,
  serverSnapshot: TValue,
  selector: (value: TValue) => TSelected,
  isEqual: (previous: TSelected, next: TSelected) => boolean,
): ReadableValue<TSelected> => {
  // Derived, so a source that recomputes to the same observable keeps its listener.
  const source = $derived(observable());
  // Raw, so the snapshot keeps its identity instead of being proxied.
  let snapshot: TValue = $state.raw(serverSnapshot);

  // Effects never run on the server and run after mount on the client, so both read the server snapshot first.
  $effect(() => {
    const current = source;

    snapshot = current.get();

    return current.subscribe(() => {
      snapshot = current.get();
    });
  });

  // An equal selection keeps the last reference, so nothing downstream runs again.
  const select = createSelection(() => snapshot, selector, isEqual);
  const selected = $derived(select());

  return {
    get current() {
      return selected;
    },
  };
};
