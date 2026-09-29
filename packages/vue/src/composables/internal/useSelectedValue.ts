import type { ObservableValue } from "@priemskiyyy/reach";
import { computed, onMounted, onWatcherCleanup, shallowRef, watch } from "vue";
import type { ComputedRef, ShallowRef } from "vue";

import { createSelection } from "src/utils/createSelection";

/**
 * Reads a selection of an observable as a read-only computed ref. It
 * subscribes only once mounted, so the server and the hydrating render read
 * the selection of `serverSnapshot`, and it follows a new observable.
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
): ComputedRef<TSelected> => {
  // Annotated, because `shallowRef` answers a generic with a conditional type that reads as `any`.
  const snapshot: ShallowRef<TValue> = shallowRef(serverSnapshot);

  onMounted(() => {
    watch(
      observable,
      (current) => {
        snapshot.value = current.get();
        onWatcherCleanup(
          current.subscribe(() => {
            snapshot.value = current.get();
          }),
        );
      },
      { immediate: true, flush: "sync" },
    );
  });

  // An equal selection keeps the last reference, so the ref does not notify.
  return computed(createSelection(() => snapshot.value, selector, isEqual));
};
