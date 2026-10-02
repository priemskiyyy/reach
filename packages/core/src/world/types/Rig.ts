import type { MockEndpoint } from "src/mock/types/MockEndpoint";
import type { Activity } from "src/types/Activity";
import type { Condition } from "src/types/Condition";
import type { EndpointHandle } from "src/types/EndpointHandle";
import type { NetworkState } from "src/types/NetworkState";
import type { RuntimeLease } from "src/types/RuntimeLease";
import type { ValueStore } from "src/utils/internal/observable/ValueStore";
import type { Reach } from "src/utils/Reach";
import type { Violation } from "src/world/types/Violation";
import type { World } from "src/world/types/World";

/** Everything one script runs against, and what the oracles carry from step to step. */
export type Rig = {
  world: World;
  reach: Reach<null, "api">;
  probe: MockEndpoint;
  api: EndpointHandle;
  activity: ValueStore<Activity>;
  online: Condition;
  offline: Condition;
  violations: Violation[];
  lease: RuntimeLease | null;
  disposed: boolean;
  step: number;
  previous: NetworkState;
  disposedState: NetworkState;
};
