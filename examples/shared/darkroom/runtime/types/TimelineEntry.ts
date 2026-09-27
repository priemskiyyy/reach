import type { ReachDiagnosticEvent } from "@priemskiyyy/reach";

import type { NetworkSource } from "example-shared/darkroom/network/types/NetworkSource";

export type TimelineEntry = ReachDiagnosticEvent & {
  id: number;
  source: NetworkSource;
};
