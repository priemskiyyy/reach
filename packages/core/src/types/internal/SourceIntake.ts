import type { NetworkFacts } from "src/types/internal/NetworkFacts";

export type SourceIntake =
  | { kind: "observation"; sequence: number; facts: NetworkFacts }
  | { kind: "error"; sequence: number; reason: string }
  | {
      kind: "gap";
      sequence: number;
      reason: "observation-gap" | "source-reset";
    };
