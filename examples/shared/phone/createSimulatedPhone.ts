import type {
  NetworkAdapter,
  NetworkAdapterContext,
  ObservationSlot,
} from "@priemskiyyy/reach";

import { PHONE_CAPABILITIES } from "example-shared/phone/constants/capabilities";
import { LINK_REPORTS } from "example-shared/phone/constants/links";
import { JOIN_DELAY, PHONE_NATIVE } from "example-shared/phone/constants/phone";
import { readPhoneObservation } from "example-shared/phone/readPhoneObservation";
import type { PhoneLink } from "example-shared/phone/types/PhoneLink";
import type { PhoneState } from "example-shared/phone/types/PhoneState";
import type { SimulatedPhoneNative } from "example-shared/phone/types/SimulatedPhoneNative";
import { createValueStore } from "example-shared/utils/createValueStore";

const readType = (link: PhoneLink) =>
  link === "none" ? "none" : LINK_REPORTS[link].type;

// Another network of the same type looks the same in its connection facts.
const isSameTypeSwitch = (previous: PhoneLink, next: PhoneLink) =>
  previous !== next && readType(previous) === readType(next);

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
    joining: false,
  });

  const sessions = new Set<NetworkAdapterContext>();

  // While joining the phone says nothing, and a failing service says only that it failed.
  const report = (target: ObservationSlot) => {
    const current = state.get();

    if (current.joining) {
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
    /**
     * Joins another link. A switch to another network of the same type looks
     * the same in every fact, so the phone says it may have missed changes
     * and reports again once joined.
     */
    setLink: (link: PhoneLink) => {
      const { link: previous, joining } = state.get();

      if (joining || !isSameTypeSwitch(previous, link)) {
        update({ link });

        return;
      }

      update({ link, joining: true });

      for (const context of sessions) {
        context.invalidate();
      }

      setTimeout(() => {
        update({ joining: false });
      }, JOIN_DELAY);
    },
    setLowDataMode: (lowDataMode: boolean) => {
      update({ lowDataMode });
    },
    setFailing: (failing: boolean) => {
      update({ failing });
    },
    sessionCount: () => sessions.size,
  };
};
