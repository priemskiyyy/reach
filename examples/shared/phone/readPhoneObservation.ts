import type {
  EvidenceBasis,
  FieldObservation,
  NetworkObservation,
} from "@priemskiyyy/reach";

import { LINK_REPORTS } from "example-shared/phone/constants/links";
import type { PhoneState } from "example-shared/phone/types/PhoneState";

const fact = <TValue>(
  value: TValue,
  basis: Exclude<EvidenceBasis, "none">,
): FieldObservation<TValue> => ({ status: "current", value, basis });

/**
 * One complete report from the phone. Without a link it is offline on the
 * phone's own path. Behind a sign-in page the phone could not validate the
 * internet, and that is unknown, never offline.
 */
export const readPhoneObservation = ({
  link,
  lowDataMode,
}: PhoneState): NetworkObservation => {
  const preferences: NetworkObservation["preferences"] = {
    constrained: fact(lowDataMode, "user-data-preference"),
    saveData: { status: "unsupported" },
  };

  if (link === "none") {
    return {
      connection: {
        status: fact("disconnected", "native-path"),
        type: fact("none", "native-path"),
        transports: fact([], "native-path"),
      },
      internet: { status: fact("offline", "native-path") },
      cost: {
        metered: { status: "unknown", reason: "disconnected" },
        expensive: { status: "unknown", reason: "disconnected" },
      },
      preferences,
    };
  }

  const { type, metered, expensive, validated } = LINK_REPORTS[link];

  return {
    connection: {
      status: fact("connected", "native-path"),
      type: fact(type, "native-path"),
      transports: fact([type], "native-path"),
    },
    internet: {
      status: validated
        ? fact("online", "native-validation")
        : { status: "unknown", reason: "source-ambiguous" },
    },
    cost: {
      metered: fact(metered, "native-metering"),
      expensive: fact(expensive, "native-expense"),
    },
    preferences,
  };
};
