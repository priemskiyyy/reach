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

// React Native types the current state as a plain string from 0.87, and a later release can add a status.
const isStatus = (state: string): state is AppStateStatus =>
  Object.prototype.hasOwnProperty.call(ACTIVITIES, state);

const readActivity = (state: string | null | undefined): Activity => {
  if (state === null || state === undefined || !isStatus(state)) {
    return "unknown";
  }

  return ACTIVITIES[state];
};

/** The app's state as Reach's activity source: only an active app checks the API on its own. */
export const appActivity: ObservableValue<Activity> = {
  get: () => readActivity(AppState.currentState),
  subscribe: (listener) => {
    const subscription = AppState.addEventListener("change", listener);

    return () => {
      subscription.remove();
    };
  },
};
