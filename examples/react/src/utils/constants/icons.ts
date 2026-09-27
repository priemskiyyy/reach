import { Browser, DeviceMobile } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

import type { NetworkSource } from "example-shared/darkroom/network/types/NetworkSource";

export const SOURCE_ICONS: Record<NetworkSource, Icon> = {
  phone: DeviceMobile,
  browser: Browser,
};
