import type { ObservableValue } from "@priemskiyyy/reach";
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import type { Accessor } from "solid-js";

/**
 * Reads a selection of an observable as an accessor. It subscribes only once
 * mounted, so the server and the hydrating render read the selection of
 * `serverSnapshot`, and it follows a new observable.
 *
 * @example
 * ```ts
 * const status = useSelectedValue(() => network.state, UNKNOWN_NETWORK_STATE, selectStatus, Object.is);
 * ```
 */
export const useSelectedValue = <TValue, TSelected>(
  observable: Accessor<ObservableValue<TValue>>,
  serverSnapshot: TValue,
  selector: (value: TValue) => TSelected,
  isEqual: (previous: TSelected, next: TSelected) => boolean,
): Accessor<TSelected> => {
  const [snapshot, setSnapshot] = createSignal(serverSnapshot);
  // A memo, so a source that recomputes to the same observable keeps its listener.
  const source = createMemo(observable);

  // Solid claims server markup as it is while hydrating, so the value reads the server snapshot until mounted.
  onMount(() => {
    createEffect(() => {
      const current = source();

      setSnapshot(() => current.get());
      onCleanup(current.subscribe(() => setSnapshot(() => current.get())));
    });
  });

  // An equal selection keeps the last one, so nothing downstream runs again.
  return createMemo(() => selector(snapshot()), undefined, { equals: isEqual });
};
