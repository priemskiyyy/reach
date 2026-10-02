/** How many scripts, from which seed, how long, and how strictly the fuzz runs. */
export const RUNS = Number(process.env["WORLD_RUNS"] ?? 3_000);
export const SEED = Number(process.env["WORLD_SEED"] ?? 20_261_002);
export const STEPS = Number(process.env["WORLD_STEPS"] ?? 30);

/** The world may also change silently while the app is in the foreground. */
export const STRICT = process.env["WORLD_STRICT"] === "1";

/** Print every class with a minimal replay, documented limits included, instead of asserting. */
export const SURVEY = process.env["WORLD_SURVEY"] === "1";

/** One script, as a failure prints it. */
export const REPLAY = process.env["WORLD_REPLAY"] ?? "";

/** Further classes to skip by name, on top of the documented limits. */
export const IGNORED = (process.env["WORLD_IGNORE"] ?? "")
  .split(",")
  .filter((kind) => kind !== "");
