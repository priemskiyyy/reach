import type { NetworkSession } from "src/types/NetworkSession";
import type { RuntimeSession } from "src/types/internal/RuntimeSession";
import type { ReachError } from "src/utils/ReachError";

export type RuntimeOwnership<TNative> =
  | { state: "IDLE" }
  | { state: "STARTING"; session: RuntimeSession }
  | {
      state: "RUNNING";
      session: RuntimeSession;
      source: NetworkSession<TNative>;
    }
  | { state: "FAILED"; error: ReachError }
  | { state: "DISPOSED" };
