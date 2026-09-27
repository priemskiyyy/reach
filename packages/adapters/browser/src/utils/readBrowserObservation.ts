import type { NetworkObservation } from "@priemskiyyy/reach";

import type { BrowserWindowLike } from "src/types/BrowserWindowLike";
import { readConnectionStatus } from "src/utils/readConnectionStatus";
import { readConnectionType } from "src/utils/readConnectionType";
import { readSaveData } from "src/utils/readSaveData";

/** One complete report: the browser observes no internet, no transport set and no cost. */
export const readBrowserObservation = (
  window: BrowserWindowLike,
): NetworkObservation => {
  const connection = window.navigator.connection ?? null;

  return {
    connection: {
      status: readConnectionStatus(window.navigator),
      type: readConnectionType(connection),
      transports: { status: "unsupported" },
    },
    internet: { status: { status: "unsupported" } },
    cost: {
      metered: { status: "unsupported" },
      expensive: { status: "unsupported" },
    },
    preferences: {
      constrained: { status: "unsupported" },
      saveData: readSaveData(connection),
    },
  };
};
