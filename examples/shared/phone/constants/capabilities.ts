import type { NetworkCapabilities } from "@priemskiyyy/reach";

/** The phone reports every change of every fact but data saver, which is a browser's. */
export const PHONE_CAPABILITIES: NetworkCapabilities = {
  "connection.status": {
    support: "supported",
    notifications: "complete",
    bases: ["native-path"],
  },
  "connection.type": {
    support: "supported",
    notifications: "complete",
    bases: ["native-path"],
  },
  "connection.transports": {
    support: "supported",
    notifications: "complete",
    bases: ["native-path"],
  },
  "internet.status": {
    support: "supported",
    notifications: "complete",
    bases: ["native-path", "native-validation"],
  },
  "cost.metered": {
    support: "supported",
    notifications: "complete",
    bases: ["native-metering"],
  },
  "cost.expensive": {
    support: "supported",
    notifications: "complete",
    bases: ["native-expense"],
  },
  "preferences.constrained": {
    support: "supported",
    notifications: "complete",
    bases: ["user-data-preference"],
  },
  "preferences.saveData": { support: "unsupported" },
};
