import type { RefreshResult } from "src/types/RefreshResult";
import type { SourceIntake } from "src/types/internal/SourceIntake";
import type { ResourceScope } from "src/utils/internal/runtime/ResourceScope";

export type RefreshFlight = {
  promise: Promise<RefreshResult>;
  reject: (error: unknown) => void;
};

export type RuntimeSession = {
  id: number;
  scope: ResourceScope;
  /** The last place handed out in the source's order. */
  reserved: number;
  /** The last place whose report was accepted; older ones are obsolete. */
  committed: number;
  /** The newest report while the session opens, adopted with it. */
  pending: SourceIntake | null;
  cancelOpening: () => void;
  refresh: RefreshFlight | null;
};
