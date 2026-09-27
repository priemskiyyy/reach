import type { ReachErrorCode } from "src/types/ReachErrorCode";

/**
 * The part of an error that published state keeps: its code and Reach's own
 * message, never the cause, a URL, a header or a provider payload.
 *
 * @example
 * ```ts
 * const error: ReachErrorInfo = { code: "SOURCE_TIMEOUT", message: "The adapter did not open in time." };
 * ```
 */
export type ReachErrorInfo = {
  code: ReachErrorCode;
  message: string;
};
