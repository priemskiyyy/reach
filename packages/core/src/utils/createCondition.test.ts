import { expect, test, vi } from "vitest";

import { createCondition } from "src/utils/createCondition";
import { ValueStore } from "src/utils/internal/observable/ValueStore";
import {
  CONNECTED_CELLULAR,
  CONNECTED_WIFI,
  createReach,
} from "src/utils/Reach.fixture";
import { ReachError } from "src/utils/ReachError";

test("T060 a custom condition follows every declared source", () => {
  const metered = new ValueStore<boolean | null>(null);
  const settings = new ValueStore({ allowAnyNetwork: false });
  const listener = vi.fn();

  const policy = createCondition({
    sources: { metered: metered.observable, settings: settings.observable },
    evaluate: ({ metered: isMetered, settings: { allowAnyNetwork } }) => {
      if (allowAnyNetwork) {
        return "met";
      }

      if (isMetered === null) {
        return {
          status: "unknown",
          reasons: [
            { code: "unsupported", field: "cost.metered", endpoint: null },
          ],
        };
      }

      return isMetered ? "unmet" : "met";
    },
  });

  policy.subscribe(listener);

  expect(policy.get()).toEqual({
    status: "unknown",
    reasons: [{ code: "unsupported", field: "cost.metered", endpoint: null }],
  });

  settings.update({ allowAnyNetwork: true });
  expect(policy.get().status).toBe("met");

  settings.update({ allowAnyNetwork: false });
  metered.update(true);
  expect(policy.get()).toEqual({ status: "unmet", reasons: [] });
  expect(listener).toHaveBeenCalledTimes(3);
});

test("T060 a value the evaluator closes over is not observed", () => {
  const trigger = new ValueStore(0);
  const listener = vi.fn();
  let closedOver = "unmet";

  const condition = createCondition({
    sources: { trigger: trigger.observable },
    evaluate: () => (closedOver === "met" ? "met" : "unmet"),
  });

  condition.subscribe(listener);
  closedOver = "met";

  expect(listener).not.toHaveBeenCalled();
  expect(condition.get().status).toBe("unmet");
});

test("T064 the network and an unrelated store update independently, each with its own notification", () => {
  const { reach, mock } = createReach({ initial: CONNECTED_WIFI });
  const settings = new ValueStore({ allowCellular: false });
  const seen: string[] = [];

  const uploads = createCondition({
    sources: { network: reach.state, settings: settings.observable },
    evaluate: ({ network, settings: { allowCellular } }) => {
      if (network.connection.type === "wifi") {
        return "met";
      }

      return allowCellular ? "met" : "unmet";
    },
  });

  uploads.subscribe(() => seen.push(uploads.get().status));

  reach.start();
  mock.emit(CONNECTED_CELLULAR);
  settings.update({ allowCellular: true });

  // Nothing makes the two stores change together: the reader sees the step between them.
  expect(seen).toEqual(["met", "unmet", "met"]);
});

test("T061 a throwing evaluator answers unknown and reports an evaluation error", () => {
  const failure = new Error("evaluator");
  const onError = vi.fn();
  const source = new ValueStore(1);

  const condition = createCondition({
    sources: { source: source.observable },
    evaluate: () => {
      throw failure;
    },
    onError,
  });

  expect(condition.get()).toEqual({
    status: "unknown",
    reasons: [{ code: "evaluation-error", field: null, endpoint: null }],
  });
  expect(onError).toHaveBeenCalledWith(
    expect.objectContaining({ code: "EVALUATION_ERROR", cause: failure }),
  );
  expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(ReachError);
});

test("T061 a throwing source answers unknown, and a later valid read recovers", () => {
  const source = new ValueStore(1);
  let broken = true;

  const condition = createCondition({
    sources: {
      value: {
        get: () => {
          if (broken) {
            throw new Error("source");
          }

          return source.get();
        },
        subscribe: source.subscribe,
      },
    },
    evaluate: ({ value }) => (value > 0 ? "met" : "unmet"),
    onError: () => {},
  });

  expect(condition.get().status).toBe("unknown");

  broken = false;
  expect(condition.get().status).toBe("met");
});

test("custom reasons are copied and frozen, never kept by reference", () => {
  const source = new ValueStore(1);
  const reason = { code: "settings-loading", field: null, endpoint: null };

  const condition = createCondition({
    sources: { source: source.observable },
    evaluate: () => ({ status: "unknown", reasons: [reason] }),
  });

  const state = condition.get();

  reason.code = "changed";

  expect(state.reasons).toEqual([
    { code: "settings-loading", field: null, endpoint: null },
  ]);
  expect(Object.isFrozen(state)).toBe(true);
  expect(Object.isFrozen(state.reasons)).toBe(true);
});
