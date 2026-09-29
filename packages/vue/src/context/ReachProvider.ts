import {
  computed,
  defineComponent,
  onMounted,
  onWatcherCleanup,
  provide,
  watch,
} from "vue";

import { REACH_CONTEXT } from "src/context/ReachContext";
import type { ReachProviderProps } from "src/types/ReachProviderProps";

/**
 * Publishes one Reach to the components below. With `start`, it holds a
 * runtime lease while mounted and releases only that lease on unmount; it
 * never disposes the Reach, and it starts no endpoint monitor.
 *
 * @example
 * ```vue
 * <ReachProvider :network="network" start>
 *   <Application />
 * </ReachProvider>
 * ```
 */
export const ReachProvider = defineComponent(
  (props: ReachProviderProps, { slots }) => {
    provide(
      REACH_CONTEXT,
      computed(() => props.network),
    );

    // Mounted hooks never run on the server, so only a mounted provider holds a lease.
    onMounted(() => {
      watch(
        [() => props.network, () => props.start],
        ([network, start]) => {
          if (!start) {
            return;
          }

          onWatcherCleanup(network.start().release);
        },
        { immediate: true, flush: "sync" },
      );
    });

    return () => slots.default?.();
  },
  {
    name: "ReachProvider",
    props: {
      network: { type: Object, required: true },
      start: { type: Boolean, default: false },
    },
  },
);
