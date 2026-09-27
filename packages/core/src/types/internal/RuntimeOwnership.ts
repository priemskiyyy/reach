import type { NetworkSession } from "src/types/NetworkSession";
import type { RuntimeSession } from "src/types/internal/RuntimeSession";
import type { ReachError } from "src/utils/ReachError";

export type RuntimeOwnership =
  | { state: "IDLE" }
  | { state: "STARTING"; session: RuntimeSession }
  | {
      state: "RUNNING";
      session: RuntimeSession;
      /** How the running source reads again, or `null` when it cannot. */
      refresh: NonNullable<NetworkSession<unknown>["refresh"]> | null;
    }
  | { state: "FAILED"; error: ReachError }
  | { state: "DISPOSED" };
