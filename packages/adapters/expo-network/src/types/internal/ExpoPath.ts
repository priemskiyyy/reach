import type { Transport } from "@priemskiyyy/reach";

/**
 * What one Expo state says about the path: `connected` over a transport, a
 * trusted `no-path`, an `ambiguous` negative tuple, or `unreported`.
 */
export type ExpoPath =
  | { kind: "connected"; transport: Transport | undefined }
  | { kind: "no-path" }
  | { kind: "ambiguous" }
  | { kind: "unreported" };
