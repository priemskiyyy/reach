import { createPhotosBackend } from "example-shared/backend/createPhotosBackend";
import { createCameraRoll } from "example-shared/darkroom/photos/createCameraRoll";
import { createDarkroomRuntime } from "example-shared/darkroom/runtime/createDarkroomRuntime";
import { createTimeline } from "example-shared/darkroom/runtime/createTimeline";
import type { DarkroomServices } from "example-shared/darkroom/runtime/types/DarkroomServices";
import type { AccountId } from "example-shared/darkroom/users/types/AccountId";
import type { Activity, ObservableValue } from "@priemskiyyy/reach";
import { createSimulatedPhone } from "example-shared/phone/createSimulatedPhone";
import { createPageActivity } from "example-shared/utils/createPageActivity";
import { createValueStore } from "example-shared/utils/createValueStore";

/**
 * The phone, the API, Inês signed in, the roll and the first runtime over
 * the simulated phone, started. It runs once, before the app mounts, where
 * Strict Mode cannot start a runtime twice. Activity follows the page's
 * visibility unless a test gives its own.
 */
export const startDarkroom = ({
  latency,
  activity = createPageActivity(),
}: {
  latency: number;
  activity?: ObservableValue<Activity>;
}) => {
  const services: DarkroomServices = {
    phone: createSimulatedPhone(),
    backend: createPhotosBackend({ latency }),
    account: createValueStore<AccountId | null>("ines"),
    roll: createCameraRoll(),
    automatic: createValueStore(true),
    timeline: createTimeline(),
    activity,
  };

  return {
    services,
    runtime: createDarkroomRuntime({ ...services, source: "phone" }),
  };
};
