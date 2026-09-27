import type { RefreshResult } from "@priemskiyyy/reach";

export type RefreshOutcome =
  { status: RefreshResult["status"] } | { status: "failed"; error: unknown };
