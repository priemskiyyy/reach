import type { Epoch } from "src/world/types/Epoch";

/** The network generation the world was in when the entry at `order` was logged. */
export const epochAt = (epochs: Epoch[], order: number) =>
  epochs.filter((entry) => entry.order <= order).at(-1)?.epoch ?? 0;
