import type { ComputedRef, InjectionKey } from "vue";

import type { ReachNetwork } from "src/types/ReachNetwork";

export const REACH_CONTEXT: InjectionKey<ComputedRef<ReachNetwork>> =
  Symbol("reach");
