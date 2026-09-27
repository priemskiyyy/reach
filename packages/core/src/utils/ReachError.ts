import type { ReachErrorCode } from "src/types/ReachErrorCode";

/**
 * An error Reach created, with a `code` to branch on. Whatever an adapter,
 * check or listener threw stays on `cause`, and only on the thrown error:
 * published state keeps the code and message alone.
 *
 * @example
 * ```ts
 * try {
 *   await api.check();
 * } catch (error) {
 *   if (error instanceof ReachError && error.code === "SUPERSEDED") {
 *     console.info("The network changed during the check.");
 *   }
 * }
 * ```
 */
export class ReachError extends Error {
  code: ReachErrorCode;

  constructor({
    code,
    message,
    cause,
  }: {
    code: ReachErrorCode;
    message: string;
    cause?: unknown;
  }) {
    // `{ cause: undefined }` would still give the error a `cause` of its own.
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ReachError";
    this.code = code;
  }
}
