import type { EndpointCheck } from "src/types/EndpointCheck";
import type { MonitorTrigger } from "src/types/MonitorTrigger";
import type { ObservableValue } from "src/types/ObservableValue";

export type ResolvedEndpoint = {
  name: string;
  check: EndpointCheck;
  staleAfter: number;
  timeout: number;
  scope: ObservableValue<string | null> | null;
  monitoring: {
    on: MonitorTrigger[];
    interval: number | null;
    minInterval: number;
    whenOffline: "skip" | "attempt";
    jitter: number;
  };
};
