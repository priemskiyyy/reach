import { ReachError } from "src/utils/ReachError";

/** A count option as a positive whole number, or its default when it was left out. */
export const resolveCount = (
  name: string,
  value: number | undefined,
  fallback: number,
) => {
  const count = value ?? fallback;

  // The type allows NaN, fractions, infinities and negatives; a count does not.
  if (!Number.isSafeInteger(count) || count <= 0) {
    throw new ReachError({
      code: "INVALID_CONFIGURATION",
      message: `${name} must be a positive whole number.`,
    });
  }

  return count;
};
