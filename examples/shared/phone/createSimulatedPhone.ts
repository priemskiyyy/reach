import type {
  NetworkAdapter,
  NetworkAdapterContext,
  ObservationSlot,
} from "@priemskiyyy/reach";

import { PHONE_CAPABILITIES } from "example-shared/phone/constants/capabilities";
import {
  PHONE_NATIVE,
  REJOIN_DELAY,
} from "example-shared/phone/constants/phone";
import { readPhoneObservation } from "example-shared/phone/readPhoneObservation";
import type { PhoneLink } from "example-shared/phone/types/PhoneLink";
import type { PhoneState } from "example-shared/phone/types/PhoneState";
import type { SimulatedPhoneNative } from "example-shared/phone/types/SimulatedPhoneNative";
import { createValueStore } from "example-shared/utils/createValueStore";

/**
 * A phone's network stack inside the page, and a real Reach adapter over it.
 * The lab changes its link, Low Data Mode and service, and every change is
 * reported to each open session, as a native SDK's listener would.
 */
export const createSimulatedPhone = () => {
  const state = createValueStore<PhoneState>({
    link: "wifi",
    lowDataMode: false,
    failing: false,
    rejoining: false,
  });

  const sessions = new Set<NetworkAdapterContext>();

  // Between networks the phone says nothing, and a failing service says only that it failed.
  const report = (target: ObservationSlot) => {
    const current = state.get();

    if (current.rejoining) {
      return;
    }

    if (current.failing) {
      target.reportError(
        new Error("The phone's connectivity service stopped answering."),
      );

      return;
    }

    target.emit(readPhoneObservation(current));
  };

  const adapter: NetworkAdapter<SimulatedPhoneNative> = {
    name: "simulated-phone",
    available: () => true,
    open: (context) => {
      const stop = state.subscribe(() => report(context));

      sessions.add(context);
      context.onDispose(() => {
        stop();
        sessions.delete(context);
      });
      report(context);

      return {
        native: PHONE_NATIVE,
        capabilities: PHONE_CAPABILITIES,
        refresh: ({ emit }) =>
          report({ emit, reportError: context.reportError }),
      };
    },
  };

  const update = (patch: Partial<PhoneState>) => {
    state.set({ ...state.get(), ...patch });
  };

  return {
    adapter,
    state: { get: state.get, subscribe: state.subscribe },
    setLink: (link: PhoneLink) => {
      update({ link });
    },
    setLowDataMode: (lowDataMode: boolean) => {
      update({ lowDataMode });
    },
    setFailing: (failing: boolean) => {
      update({ failing });
    },
    /**
     * Moves to another Wi-Fi of the same name. The type never changes, so the
     * phone says it may have missed changes, and reports again once joined.
     */
    rejoin: () => {
      if (state.get().rejoining) {
        return;
      }

      update({ rejoining: true });

      for (const context of sessions) {
        context.invalidate();
      }

      setTimeout(() => {
        update({ rejoining: false });
      }, REJOIN_DELAY);
    },
    sessionCount: () => sessions.size,
  };
};
