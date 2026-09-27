import { ReachError } from "@priemskiyyy/reach";

import type { NetInfoAdapterOptions } from "src/types/NetInfoAdapterOptions";
import type { NetInfoProfile } from "src/types/internal/NetInfoProfile";

// NetInfo's web module conflates data saving with expense, so the web belongs to the browser adapter.
export const getNetInfoProfile = ({
  platform,
  internet = "reported",
}: NetInfoAdapterOptions): NetInfoProfile => {
  if (platform === "ios") {
    return { platform, internet };
  }

  if (platform === "android") {
    return { platform, internet };
  }

  throw new ReachError({
    code: "UNSUPPORTED_ENVIRONMENT",
    message: `The netinfo adapter maps iOS and Android, not ${platform}. Use the browser adapter on the web.`,
  });
};
