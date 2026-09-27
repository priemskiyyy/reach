import type { EndpointObservation } from "@priemskiyyy/reach";

export type CheckRequest =
  | { state: "running"; callers: number }
  | {
      state: "settled";
      callers: number;
      /** How many checks answered every caller: one, when they joined. */
      checks: number;
      observation: EndpointObservation;
    }
  | { state: "failed"; callers: number; error: unknown };
