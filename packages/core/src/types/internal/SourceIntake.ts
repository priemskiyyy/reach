import type { NetworkFacts } from "src/types/internal/NetworkFacts";
import type { NetworkObservation } from "src/types/NetworkObservation";

export type SourceIntake =
  | {
      kind: "observation";
      sequence: number;
      facts: NetworkFacts;
      route: NetworkObservation["route"];
    }
  | { kind: "error"; sequence: number; reason: string }
  | {
      kind: "gap";
      sequence: number;
      reason: "observation-gap" | "source-reset";
    };
