import { ReachError } from "src/utils/ReachError";

export const createAbortedError = () =>
  new ReachError({
    code: "ABORTED",
    message: "The caller's signal aborted the wait.",
  });
