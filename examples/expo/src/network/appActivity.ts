import type { Activity, ObservableValue } from "@priemskiyyy/reach";
import { AppState } from "react-native";
import type { AppStateStatus } from "react-native";

const ACTIVITIES: Record<AppStateStatus, Activity> = {
  active: "foreground",
  background: "background",
  inactive: "background",
  extension: "background",
  unknown: "unknown",
};

/** The app's state as Reach's activity source: only an active app checks the API on its own. */
export const appActivity: ObservableValue<Activity> = {
  get: () => ACTIVITIES[AppState.currentState],
  subscribe: (listener) => {
    const subscription = AppState.addEventListener("change", listener);

    return () => {
      subscription.remove();
    };
  },
};
