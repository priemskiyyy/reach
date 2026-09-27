import type { Activity, ObservableValue } from "@priemskiyyy/reach";

import type { PhotosBackend } from "example-shared/backend/types/PhotosBackend";
import type { CameraRoll } from "example-shared/darkroom/photos/types/CameraRoll";
import type { Timeline } from "example-shared/darkroom/runtime/types/Timeline";
import type { AccountId } from "example-shared/darkroom/users/types/AccountId";
import type { SimulatedPhone } from "example-shared/phone/types/SimulatedPhone";
import type { ValueStore } from "example-shared/types/ValueStore";

/** What outlives a switch of network source: the phone, the API, the account, the roll and the timeline. */
export type DarkroomServices = {
  phone: SimulatedPhone;
  backend: PhotosBackend;
  account: ValueStore<AccountId | null>;
  roll: CameraRoll;
  /** Whether automatic backup is switched on. */
  automatic: ValueStore<boolean>;
  timeline: Timeline;
  activity: ObservableValue<Activity>;
};
