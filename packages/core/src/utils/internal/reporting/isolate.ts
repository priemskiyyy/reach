import { isPromiseLike } from "src/utils/internal/common/isPromiseLike";

/** Runs an application callback so that its failure, thrown or rejected, reaches `report` and nothing else. */
export const isolate = (run: () => void, report: (error: unknown) => void) => {
  try {
    const result: unknown = run();

    if (isPromiseLike(result)) {
      result.then(undefined, report);
    }
  } catch (error) {
    report(error);
  }
};
