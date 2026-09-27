import type { RequestOutcome } from "example-shared/backend/types/RequestOutcome";

export const REQUEST_LABELS: Record<RequestOutcome, string> = {
  ready: "200 ready",
  degraded: "200 degraded",
  stored: "201",
  unavailable: "503",
  aborted: "Aborted",
  "no-signal": "No signal",
  portal: "Sign-in page",
};
