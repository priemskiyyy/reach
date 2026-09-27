import { ReachError } from "src/utils/ReachError";

export const createDisposedError = () =>
  new ReachError({
    code: "DISPOSED",
    message: "This Reach was disposed. Create a new one to observe again.",
  });
