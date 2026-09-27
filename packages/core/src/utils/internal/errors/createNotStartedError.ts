import { ReachError } from "src/utils/ReachError";

export const createNotStartedError = () =>
  new ReachError({
    code: "NOT_STARTED",
    message: "This needs a runtime lease. Call start() first.",
  });
