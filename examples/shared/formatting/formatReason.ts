import type { ConditionReason } from "@priemskiyyy/reach";
import { match, P } from "ts-pattern";

import {
  FIELD_LABELS,
  FIELD_QUESTIONS,
} from "example-shared/darkroom/network/constants/labels";

/**
 * One reason in Darkroom's words, as a clause that follows "Paused:" or
 * "Waiting:". A mismatch reads against the requirement Darkroom sets for
 * that fact; an unknown fact says why nothing can tell it.
 */
export const formatReason = (reason: ConditionReason) =>
  match(reason)
    .with(
      { code: "endpoint-unavailable", endpoint: P.string },
      () => "the API's last check failed",
    )
    .with(
      { code: "scope-unavailable", endpoint: P.string },
      () => "nobody is signed in, so the API is not checked",
    )
    .with(
      { code: "unobserved", endpoint: P.string },
      () => "the API has not been checked yet",
    )
    .with(
      { code: "stale", endpoint: P.string },
      () => "the API's last answer no longer holds",
    )
    .with(
      { endpoint: P.string },
      ({ code }) => `the API's last check was inconclusive (${code})`,
    )
    .with(
      { code: "mismatch", field: "internet.status" },
      () => "the internet is offline",
    )
    .with(
      { code: "mismatch", field: "cost.metered" },
      () => "the connection is metered",
    )
    .with(
      { code: "mismatch", field: "preferences.constrained" },
      () => "Low Data Mode is on",
    )
    .with(
      { code: "mismatch", field: P.string },
      ({ field }) => `${FIELD_LABELS[field]} is not what this needs`,
    )
    .with(
      { code: "unobserved", field: P.string },
      ({ field }) => `nothing has told ${FIELD_QUESTIONS[field]} yet`,
    )
    .with(
      { code: "unsupported", field: P.string },
      ({ field }) => `this source cannot tell ${FIELD_QUESTIONS[field]}`,
    )
    .with(
      { code: "source-unavailable", field: P.string },
      ({ field }) =>
        `this host has no network source to tell ${FIELD_QUESTIONS[field]}`,
    )
    .with(
      { code: "source-ambiguous", field: P.string },
      ({ field }) => `the source could not tell ${FIELD_QUESTIONS[field]}`,
    )
    .with(
      { code: "disconnected", field: P.string },
      ({ field }) =>
        `without a connection nothing tells ${FIELD_QUESTIONS[field]}`,
    )
    .with(
      { code: "observation-gap" },
      () => "the source may have missed a change",
    )
    .with({ code: "source-error" }, () => "the network source failed")
    .with(
      { code: P.union("runtime-idle", "runtime-stopped", "runtime-disposed") },
      () => "Reach is not running",
    )
    .with(
      { code: "evaluation-error" },
      () => "a condition failed while it was evaluated",
    )
    .with(
      { field: P.string },
      ({ code, field }) => `${FIELD_LABELS[field]} is unknown (${code})`,
    )
    .otherwise(({ code }) => code);
