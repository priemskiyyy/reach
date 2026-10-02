import type { NetworkObservation } from "src/types/NetworkObservation";
import type { Truth } from "src/world/types/Truth";

/** The adapter's own mapping of a truth into one complete report, as NetInfo's is. */
export const observeTruth = ({
  path,
  reachable,
  metered,
}: Truth): NetworkObservation => {
  if (path === "none") {
    return {
      connection: {
        status: {
          status: "current",
          value: "disconnected",
          basis: "native-path",
        },
        type: { status: "current", value: "none", basis: "native-path" },
        transports: { status: "unsupported" },
      },
      internet: {
        status: { status: "current", value: "offline", basis: "native-path" },
      },
      cost: {
        metered: { status: "unknown" },
        expensive: { status: "unsupported" },
      },
      preferences: {
        constrained: { status: "unsupported" },
        saveData: { status: "unsupported" },
      },
    };
  }

  return {
    connection: {
      status: { status: "current", value: "connected", basis: "native-path" },
      type: { status: "current", value: path, basis: "native-path" },
      transports: { status: "unsupported" },
    },
    internet: {
      status:
        reachable === true
          ? { status: "current", value: "online", basis: "provider-report" }
          : { status: "unknown", reason: "source-ambiguous" },
    },
    cost: {
      metered: { status: "current", value: metered, basis: "native-metering" },
      expensive: { status: "unsupported" },
    },
    preferences: {
      constrained: { status: "unsupported" },
      saveData: { status: "unsupported" },
    },
  };
};
