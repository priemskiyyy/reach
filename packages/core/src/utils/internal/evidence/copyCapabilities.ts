import type { FieldCapability } from "src/types/FieldCapability";
import type { NetworkCapabilities } from "src/types/NetworkCapabilities";
import { freezeList } from "src/utils/internal/common/freezeList";

const copyField = ({
  support,
  notifications,
  bases,
}: FieldCapability): FieldCapability =>
  Object.freeze({ support, notifications, bases: freezeList([...bases]) });

/** A frozen copy of what an adapter declared, so the published capabilities never change under a reader. */
export const copyCapabilities = ({
  fields,
  ownership,
  routeIdentity,
  upstreamActivity,
}: NetworkCapabilities): NetworkCapabilities =>
  Object.freeze({
    fields: Object.freeze({
      "connection.status": copyField(fields["connection.status"]),
      "connection.type": copyField(fields["connection.type"]),
      "connection.transports": copyField(fields["connection.transports"]),
      "internet.status": copyField(fields["internet.status"]),
      "cost.metered": copyField(fields["cost.metered"]),
      "cost.expensive": copyField(fields["cost.expensive"]),
      "preferences.constrained": copyField(fields["preferences.constrained"]),
      "preferences.saveData": copyField(fields["preferences.saveData"]),
    }),
    ownership,
    routeIdentity,
    upstreamActivity,
  });
