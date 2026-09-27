import { Reach } from "@priemskiyyy/reach";
import type {
  Activity,
  NetworkAdapter,
  ObservableValue,
} from "@priemskiyyy/reach";
import { browser } from "@priemskiyyy/reach-browser";
import { http } from "@priemskiyyy/reach-http";

import type { PhotosBackend } from "example-shared/backend/types/PhotosBackend";
import {
  API_INTERVAL,
  API_STALE_AFTER,
  API_TIMEOUT,
} from "example-shared/darkroom/network/constants/endpoint";
import { readRoute } from "example-shared/darkroom/network/readRoute";
import type { DarkroomNative } from "example-shared/darkroom/network/types/DarkroomNative";
import type { DarkroomReach } from "example-shared/darkroom/network/types/DarkroomReach";
import type { NetworkSource } from "example-shared/darkroom/network/types/NetworkSource";
import type { AccountId } from "example-shared/darkroom/users/types/AccountId";
import type { SimulatedPhone } from "example-shared/phone/types/SimulatedPhone";

/**
 * Darkroom's one Reach, and the boundary of this example: everything below
 * is real Reach and adapter code, and only the phone and the API behind
 * them are simulated. The API is checked for the signed-in account, so a
 * switch of account never borrows the last one's answer.
 */
export const createDarkroomReach = ({
  source,
  phone,
  backend,
  account,
  activity,
}: {
  source: NetworkSource;
  phone: SimulatedPhone;
  backend: PhotosBackend;
  account: ObservableValue<AccountId | null>;
  activity: ObservableValue<Activity>;
}): DarkroomReach => {
  const adapter: NetworkAdapter<DarkroomNative> =
    source === "phone" ? phone.adapter : browser();

  return new Reach({
    adapter,
    endpoints: {
      api: http({
        request: ({ signal, scope }) =>
          backend.health({
            signal,
            account: scope,
            route: readRoute(source, phone.state.get()),
          }),
        test: ({ status }) => status === "ready",
        staleAfter: API_STALE_AFTER,
        timeout: API_TIMEOUT,
        scope: account,
        monitoring: {
          on: ["start", "network-change", "scope-change", "foreground"],
          interval: API_INTERVAL,
        },
      }),
    },
    activity,
  });
};
