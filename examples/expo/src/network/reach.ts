import { Reach } from "@priemskiyyy/reach";
import { http } from "@priemskiyyy/reach-http";
import { netInfo } from "@priemskiyyy/reach-netinfo";
import NetInfo from "@react-native-community/netinfo";
import { Platform } from "react-native";

import { createDarkroomConditions } from "example-shared/darkroom/network/createDarkroomConditions";
import {
  API_INTERVAL,
  API_STALE_AFTER,
  API_TIMEOUT,
} from "example-shared/darkroom/network/constants/endpoint";
import type { AccountId } from "example-shared/darkroom/users/types/AccountId";
import { createValueStore } from "example-shared/utils/createValueStore";
import { appActivity } from "src/network/appActivity";
import { readHealth } from "src/network/readHealth";

/** Who is signed in; the API is checked for this account and no other. */
export const account = createValueStore<AccountId | null>("ines");

/**
 * The app's one Reach: NetInfo on iOS and Android, and on the web, where
 * NetInfo is not a native source, every fact unsupported. The API is the
 * fixture server, checked through the app's own client.
 */
export const reach = new Reach({
  adapter: netInfo({ sdk: NetInfo, platform: Platform.OS }),
  endpoints: {
    api: http({
      request: readHealth,
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
  activity: appActivity,
});

export const api = reach.endpoint("api");

export const conditions = createDarkroomConditions(reach);
