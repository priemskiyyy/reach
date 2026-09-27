import type { ProbeContext } from "src/types/ProbeContext";
import type { ProbeResult } from "src/types/ProbeResult";

/**
 * One call of a mock endpoint's check: the context it captured, and the
 * functions that settle it. It ignores its signal until the test settles it,
 * as a check that ignores abort does.
 *
 * @example
 * ```ts
 * const [call] = probe.calls;
 *
 * call?.resolve({ verdict: "pass", response: "received" });
 * ```
 */
export type MockProbeCall = {
  context: ProbeContext;
  resolve: (result: ProbeResult) => void;
  reject: (error: unknown) => void;
  settled: () => boolean;
};
