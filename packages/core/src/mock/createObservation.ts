import type { ObservationInput } from "src/mock/types/ObservationInput";
import type { NetworkObservation } from "src/types/NetworkObservation";

/**
 * A complete observation from a partial one: each fact left out is reported
 * `unknown`.
 *
 * @example
 * ```ts
 * mock.emit(
 *   createObservation({
 *     connection: { status: observed("connected"), type: observed("wifi") },
 *     cost: { metered: observed(false, "native-metering") },
 *   }),
 * );
 * ```
 */
export const createObservation = ({
  connection = {},
  internet = {},
  cost = {},
  preferences = {},
  route,
}: ObservationInput = {}): NetworkObservation => ({
  connection: {
    status: connection.status ?? { status: "unknown" },
    type: connection.type ?? { status: "unknown" },
    transports: connection.transports ?? { status: "unknown" },
  },
  internet: {
    status: internet.status ?? { status: "unknown" },
  },
  cost: {
    metered: cost.metered ?? { status: "unknown" },
    expensive: cost.expensive ?? { status: "unknown" },
  },
  preferences: {
    constrained: preferences.constrained ?? { status: "unknown" },
    saveData: preferences.saveData ?? { status: "unknown" },
  },
  ...(route === undefined ? {} : { route }),
});
