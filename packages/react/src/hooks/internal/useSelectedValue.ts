import type { ObservableValue } from "@priemskiyyy/reach";
import { useMemo, useSyncExternalStore } from "react";

import { createSelection } from "src/utils/createSelection";

/**
 * Reads a selection of an observable through React's external store. It
 * subscribes only while mounted, and the server and the hydrating render
 * read the selection of `serverSnapshot`.
 *
 * @example
 * ```ts
 * const status = useSelectedValue(network.state, UNKNOWN_NETWORK_STATE, selectStatus, Object.is);
 * ```
 */
export const useSelectedValue = <TValue, TSelected>(
  value: ObservableValue<TValue>,
  serverSnapshot: TValue,
  selector: (value: TValue) => TSelected,
  isEqual: (previous: TSelected, next: TSelected) => boolean,
): TSelected => {
  const getSnapshot = useMemo(
    () => createSelection(value.get, selector, isEqual),
    [value, selector, isEqual],
  );

  const getServerSnapshot = useMemo(
    () => createSelection(() => serverSnapshot, selector, isEqual),
    [serverSnapshot, selector, isEqual],
  );

  return useSyncExternalStore(value.subscribe, getSnapshot, getServerSnapshot);
};
