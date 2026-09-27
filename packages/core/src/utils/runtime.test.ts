import { afterEach, expect, test, vi } from "vitest";

import { createMockNetwork } from "src/mock/createMockNetwork";
import { createTestClock } from "src/mock/createTestClock";
import { observed } from "src/mock/observed";
import { MOCK_CAPABILITIES } from "src/mock/utils/constants/capabilities";
import { UNKNOWN_NETWORK_STATE } from "src/utils/constants/network";
import {
  CONNECTED_CELLULAR,
  CONNECTED_WIFI,
  createReach,
  settle,
} from "src/utils/Reach.fixture";
import { Reach } from "src/utils/Reach";

afterEach(() => {
  vi.restoreAllMocks();
});

test("T001 constructing opens nothing, arms no timer and reads no clock", () => {
  const mock = createMockNetwork();
  const clock = createTestClock();
  const now = vi.fn(clock.now);
  const reach = new Reach({ adapter: mock.adapter, clock: { ...clock, now } });

  expect(reach.state.get()).toBe(UNKNOWN_NETWORK_STATE);
  expect(reach.status.get()).toEqual({ state: "idle" });
  expect(reach.capabilities.get()).toBeNull();
  expect(reach.native.get()).toBeNull();
  expect(mock.stats().opens).toBe(0);
  expect(clock.pendingTimers()).toBe(0);
  expect(now).not.toHaveBeenCalled();
});

test("T002 reading and subscribing start nothing, and the readables work detached", () => {
  const { reach, mock } = createReach();
  const listener = vi.fn();
  const { get, subscribe } = reach.state;

  subscribe(listener);
  reach.status.subscribe(listener);
  reach.condition({ internet: "online" }).subscribe(listener);

  expect(get()).toBe(get());
  expect(reach.state.get).toBe(get);
  expect(mock.stats().opens).toBe(0);
  expect(listener).not.toHaveBeenCalled();
});

test("starting adopts the source and publishes what it reported while opening", async () => {
  const { reach, mock } = createReach({ initial: CONNECTED_WIFI });
  const lease = reach.start();

  await expect(lease.ready).resolves.toBeUndefined();
  expect(reach.status.get()).toEqual({ state: "running", refreshing: false });
  expect(reach.state.get()).toMatchObject({
    revision: 1,
    generation: 1,
    connection: { status: "connected", type: "wifi" },
    internet: { status: "online" },
  });
  expect(reach.native.get()).toEqual({ session: 1 });
  expect(reach.capabilities.get()).toEqual(MOCK_CAPABILITIES);
  expect(mock.stats().activeSessions).toBe(1);
});

test("T033 concurrent owners share one opening and both become ready", async () => {
  const { reach, mock } = createReach({ open: "held" });
  const first = reach.start();
  const second = reach.start();

  expect(reach.status.get()).toEqual({ state: "starting" });
  mock.resolveOpen();

  await expect(first.ready).resolves.toBeUndefined();
  await expect(second.ready).resolves.toBeUndefined();
  expect(mock.stats().opens).toBe(1);
});

test("T034 one owner's release leaves the session to the others", async () => {
  const { reach, mock } = createReach();
  const first = reach.start();

  reach.start();
  first.release();
  first.release();

  expect(mock.stats().activeSessions).toBe(1);
  expect(reach.status.get().state).toBe("running");
  expect(reach.diagnostics.get().leases).toBe(1);
});

test("T035 a lease released before readiness rejects, and the others still open", async () => {
  const { reach, mock } = createReach({ open: "held" });
  const released = reach.start();
  const kept = reach.start();

  released.release();
  mock.resolveOpen();

  await expect(released.ready).rejects.toMatchObject({ code: "RELEASED" });
  await expect(kept.ready).resolves.toBeUndefined();
  expect(reach.status.get().state).toBe("running");
});

test("T036 a session that opens after its last owner left is never adopted", async () => {
  const { reach, mock } = createReach({
    open: "held",
    initial: CONNECTED_WIFI,
  });

  const lease = reach.start();

  lease.release();

  expect(mock.stats().cleanups).toBe(1);

  mock.resolveOpen();
  await settle();

  expect(reach.status.get()).toEqual({ state: "idle" });
  expect(reach.state.get()).toBe(UNKNOWN_NETWORK_STATE);
  expect(reach.native.get()).toBeNull();
  expect(reach.diagnostics.get().counters.lateCallbacks).toBe(1);
});

test("T037 a throwing open runs the cleanup it registered and rejects readiness", async () => {
  const { reach, mock } = createReach();
  const failure = new Error("sdk missing");

  mock.failNextOpen(failure);

  const lease = reach.start();

  await expect(lease.ready).rejects.toMatchObject({
    code: "SOURCE_ERROR",
    message: "The mock adapter failed to open.",
    cause: failure,
  });
  expect(mock.stats().cleanups).toBe(1);
  expect(reach.status.get()).toEqual({
    state: "error",
    error: {
      code: "SOURCE_ERROR",
      message: "The mock adapter failed to open.",
    },
  });
});

test("T038 an open that never answers times out, and its late cleanup runs at once", async () => {
  const { reach, mock, clock } = createReach({ open: "held" });
  const lease = reach.start();

  clock.advance(10_000);

  await expect(lease.ready).rejects.toMatchObject({ code: "SOURCE_TIMEOUT" });
  expect(mock.stats().cleanups).toBe(1);

  mock.resolveOpen();
  await settle();

  expect(reach.status.get().state).toBe("error");
});

test("T039 reports during opening wait for adoption", async () => {
  const { reach, mock } = createReach({ open: "held" });
  const listener = vi.fn();

  reach.state.subscribe(listener);
  reach.start();
  mock.emit(CONNECTED_WIFI);
  mock.emit(CONNECTED_CELLULAR);

  expect(listener).not.toHaveBeenCalled();
  expect(reach.state.get()).toBe(UNKNOWN_NETWORK_STATE);

  mock.resolveOpen();
  await settle();

  expect(listener).toHaveBeenCalledTimes(1);
  expect(reach.state.get()).toMatchObject({
    generation: 1,
    connection: { type: "cellular" },
  });
});

test("T040 a report before a failed opening never becomes evidence", async () => {
  const { reach, mock } = createReach({ open: "held" });
  const lease = reach.start();

  mock.emit(CONNECTED_WIFI);
  mock.rejectOpen(new Error("denied"));

  await expect(lease.ready).rejects.toMatchObject({ code: "SOURCE_ERROR" });
  expect(reach.state.get()).toBe(UNKNOWN_NETWORK_STATE);
});

test("T041 an event that arrives before a slower initial read wins", () => {
  const { reach, mock } = createReach();

  reach.start();

  const initialRead = mock.reserve();

  mock.emit(CONNECTED_CELLULAR);
  initialRead.emit(CONNECTED_WIFI);

  expect(reach.state.get().connection.type).toBe("cellular");
  expect(reach.diagnostics.get().counters.discardedObservations).toBe(1);
});

test("T042 T043 reads that finish in reverse order cannot regress the state", () => {
  const { reach, mock } = createReach();

  reach.start();

  const older = mock.reserve();
  const newer = mock.reserve();

  newer.emit(CONNECTED_CELLULAR);
  older.emit(CONNECTED_WIFI);
  older.reportError(new Error("obsolete read"));

  expect(reach.state.get().connection.type).toBe("cellular");
  expect(reach.state.get().evidence["connection.type"].status).toBe("current");
});

test("T013 an identical report publishes nothing new", () => {
  const { reach, mock, clock } = createReach({ initial: CONNECTED_WIFI });
  const listener = vi.fn();
  const internet = reach.condition({ internet: "online" });

  reach.start();

  const state = reach.state.get();

  reach.state.subscribe(listener);
  internet.subscribe(listener);
  clock.advance(5_000);
  mock.emit(CONNECTED_WIFI);

  expect(reach.state.get()).toBe(state);
  expect(listener).not.toHaveBeenCalled();
  expect(reach.diagnostics.get().counters.duplicateObservations).toBe(1);
});

test("T016 a report that leaves a fact out never keeps its old value", () => {
  const { reach, mock } = createReach();

  reach.start();
  mock.emit({ ...CONNECTED_WIFI, cost: { metered: observed(false) } });
  mock.emit(CONNECTED_WIFI);

  expect(reach.state.get().cost.metered).toBeNull();
  expect(reach.state.get().evidence["cost.metered"].status).toBe("unknown");
});

test("a cost change keeps the generation, a connection change starts a new one", () => {
  const { reach, mock } = createReach({ initial: CONNECTED_WIFI });

  reach.start();

  const { generation } = reach.state.get();

  mock.emit({ ...CONNECTED_WIFI, cost: { metered: observed(true) } });
  expect(reach.state.get().generation).toBe(generation);

  mock.emit(CONNECTED_CELLULAR);
  expect(reach.state.get().generation).toBe(generation + 1);
});

test("an observation gap turns current facts stale and starts a new generation", () => {
  const { reach, mock } = createReach({ initial: CONNECTED_WIFI });

  reach.start();
  mock.invalidate("observation-gap");

  expect(reach.state.get()).toMatchObject({
    generation: 2,
    connection: { status: "unknown", type: "unknown" },
  });
  expect(reach.state.get().evidence["connection.status"]).toMatchObject({
    status: "stale",
    basis: "native-path",
    reason: "observation-gap",
  });
});

test("T046 a source error makes facts errors, never offline", () => {
  const { reach, mock } = createReach({ initial: CONNECTED_WIFI });
  const internet = reach.condition({ internet: "online" });

  reach.start();
  mock.reportError(new Error("listener failed"));

  expect(reach.state.get().internet.status).toBe("unknown");
  expect(reach.state.get().evidence["internet.status"]).toMatchObject({
    status: "error",
    reason: "source-error",
  });
  expect(internet.get()).toEqual({
    status: "unknown",
    reasons: [
      { code: "source-error", field: "internet.status", endpoint: null },
    ],
  });
});

test("the last release makes every current fact stale and closes the session", () => {
  const { reach, mock } = createReach({ initial: CONNECTED_WIFI });
  const lease = reach.start();

  lease.release();

  expect(reach.status.get()).toEqual({ state: "idle" });
  expect(reach.native.get()).toBeNull();
  expect(reach.capabilities.get()).toBeNull();
  expect(mock.stats().activeSessions).toBe(0);
  expect(reach.state.get()).toMatchObject({
    generation: 2,
    connection: { status: "unknown" },
  });
  expect(reach.state.get().evidence["connection.status"]).toMatchObject({
    status: "stale",
    reason: "runtime-idle",
  });
});

test("T047 a new session never hears the previous one's late callbacks", () => {
  const { reach, mock } = createReach({ initial: CONNECTED_WIFI });

  reach.start().release();
  mock.unsafe.emitAfterClose(CONNECTED_CELLULAR);

  expect(reach.state.get().connection.type).toBe("unknown");
  expect(reach.diagnostics.get().counters.lateCallbacks).toBe(1);

  reach.start();
  expect(reach.native.get()).toEqual({ session: 2 });
});

test("T048 a failed opening is retried only by an explicit start, never by a timer", async () => {
  const { reach, mock, clock } = createReach();

  mock.failNextOpen(new Error("first"));

  const first = reach.start();

  await expect(first.ready).rejects.toMatchObject({ code: "SOURCE_ERROR" });
  clock.advance(60_000);
  expect(mock.stats().opens).toBe(1);

  const second = reach.start();

  await expect(second.ready).resolves.toBeUndefined();
  expect(mock.stats().opens).toBe(2);
  expect(reach.status.get().state).toBe("running");
});

test("refresh needs a lease, and rejects after disposal", async () => {
  const { reach } = createReach();

  await expect(reach.refresh()).rejects.toMatchObject({ code: "NOT_STARTED" });

  reach.dispose();
  await expect(reach.refresh()).rejects.toMatchObject({ code: "DISPOSED" });
});

test("a refresh reports the source again and says whether it changed anything", async () => {
  const { reach, mock } = createReach({ initial: CONNECTED_WIFI });

  reach.start();

  await expect(reach.refresh()).resolves.toMatchObject({
    status: "unchanged",
  });

  mock.emit(CONNECTED_CELLULAR);

  const updated = createReach({ refresh: "held", initial: CONNECTED_WIFI });

  updated.reach.start();

  const refreshing = updated.reach.refresh();

  expect(updated.reach.status.get()).toEqual({
    state: "running",
    refreshing: true,
  });
  updated.mock.resolveRefresh(CONNECTED_CELLULAR);

  await expect(refreshing).resolves.toMatchObject({
    status: "updated",
    state: { connection: { type: "cellular" } },
  });
  expect(updated.reach.status.get()).toEqual({
    state: "running",
    refreshing: false,
  });
});

test("T044 concurrent refreshes share one read, and each caller cancels only its own wait", async () => {
  const { reach, mock } = createReach({ refresh: "held" });

  reach.start();

  const controller = new AbortController();
  const cancelled = reach.refresh({ signal: controller.signal });
  const kept = reach.refresh();

  controller.abort();
  mock.resolveRefresh(CONNECTED_WIFI);

  await expect(cancelled).rejects.toMatchObject({ code: "ABORTED" });
  await expect(kept).resolves.toMatchObject({ status: "updated" });
  expect(mock.stats().refreshes).toBe(1);
});

test("a refresh overtaken by a newer event is superseded", async () => {
  const { reach, mock } = createReach({ refresh: "held" });

  reach.start();

  const refreshing = reach.refresh();

  mock.emit(CONNECTED_CELLULAR);
  mock.resolveRefresh(CONNECTED_WIFI);

  await expect(refreshing).resolves.toMatchObject({ status: "superseded" });
  expect(reach.state.get().connection.type).toBe("cellular");
});

test("T015 a refresh that repeats the same facts changes nothing and invents no verification", async () => {
  const { reach, mock } = createReach({
    refresh: "held",
    initial: CONNECTED_WIFI,
  });

  reach.start();

  const state = reach.state.get();
  const refreshing = reach.refresh();

  mock.resolveRefresh(CONNECTED_WIFI);

  await expect(refreshing).resolves.toEqual({ status: "unchanged", state });
  expect(reach.state.get()).toBe(state);
  expect(reach.state.get().evidence["internet.status"].verifiedAt).toBeNull();
});

test("T147 two instances share no network, session or runtime state", () => {
  const first = createReach({ initial: CONNECTED_WIFI });
  const second = createReach({ initial: CONNECTED_CELLULAR });

  first.reach.start();

  expect(first.reach.state.get().connection.type).toBe("wifi");
  expect(second.reach.state.get()).toBe(UNKNOWN_NETWORK_STATE);
  expect(second.mock.stats().opens).toBe(0);

  second.reach.start();
  first.reach.dispose();

  expect(second.reach.state.get().connection.type).toBe("cellular");
  expect(second.reach.status.get().state).toBe("running");
  expect(first.reach.status.get().state).toBe("disposed");
});

test("T045 a source without refresh answers unsupported and reports nothing", async () => {
  const { reach } = createReach({ refresh: "none", initial: CONNECTED_WIFI });

  reach.start();

  const state = reach.state.get();

  await expect(reach.refresh()).resolves.toEqual({
    status: "unsupported",
    state,
  });
});

test("T046 a failed refresh rejects and makes the facts errors", async () => {
  const { reach, mock } = createReach({
    refresh: "held",
    initial: CONNECTED_WIFI,
  });

  reach.start();

  const refreshing = reach.refresh();

  mock.rejectRefresh(new Error("native read failed"));

  await expect(refreshing).rejects.toMatchObject({ code: "SOURCE_ERROR" });
  expect(reach.state.get().evidence["internet.status"]).toMatchObject({
    status: "error",
    reason: "source-error",
  });
});

test("a refresh that never answers times out", async () => {
  const { reach, clock } = createReach({
    refresh: "held",
    initial: CONNECTED_WIFI,
  });

  reach.start();

  const refreshing = reach.refresh();

  clock.advance(10_000);

  await expect(refreshing).rejects.toMatchObject({ code: "SOURCE_TIMEOUT" });
  expect(reach.state.get().evidence["connection.status"].reason).toBe(
    "source-timeout",
  );
});

test("a refresh during opening waits for it", async () => {
  const { reach, mock } = createReach({ open: "held" });

  reach.start();

  const refreshing = reach.refresh();

  mock.resolveOpen();

  await expect(refreshing).resolves.toMatchObject({ status: "unchanged" });
});

test("an explicit refresh retries a failed opening", async () => {
  const { reach, mock } = createReach();

  mock.failNextOpen(new Error("first"));
  reach.start();

  await expect(reach.refresh()).resolves.toMatchObject({ status: "unchanged" });
  expect(mock.stats().opens).toBe(2);
});

test("T159 disposal is terminal and settles every pending operation", async () => {
  const { reach, mock } = createReach({
    open: "held",
    initial: CONNECTED_WIFI,
  });

  const lease = reach.start();
  const refreshing = reach.refresh();

  reach.dispose();
  reach.dispose();

  await expect(lease.ready).rejects.toMatchObject({ code: "DISPOSED" });
  await expect(refreshing).rejects.toMatchObject({ code: "DISPOSED" });
  expect(() => reach.start()).toThrow(
    expect.objectContaining({ code: "DISPOSED" }),
  );
  expect(reach.status.get()).toEqual({ state: "disposed" });
  expect(mock.stats().activeSessions).toBe(0);

  const unsubscribe = reach.state.subscribe(() => {});

  unsubscribe();
  lease.release();
});

test("disposal publishes one final stale state, then no listener runs again", () => {
  const { reach, mock } = createReach({ initial: CONNECTED_WIFI });
  const listener = vi.fn();

  reach.start();
  reach.state.subscribe(listener);
  reach.dispose();

  expect(listener).toHaveBeenCalledTimes(1);
  expect(reach.state.get().evidence["connection.status"]).toMatchObject({
    status: "stale",
    reason: "runtime-disposed",
  });

  mock.unsafe.emitAfterClose(CONNECTED_CELLULAR);
  expect(listener).toHaveBeenCalledTimes(1);
});

test("T054 a listener that disposes ends its pass; the rest hear only the final state", () => {
  const { reach, mock } = createReach();
  const heard: string[] = [];

  reach.start();
  reach.state.subscribe(() => reach.dispose());
  reach.state.subscribe(() => heard.push(reach.status.get().state));
  mock.emit(CONNECTED_WIFI);

  expect(heard).toEqual(["disposed"]);
});

test("T158 a throwing cleanup is reported, and the rest of disposal still runs", () => {
  const reported: unknown[] = [];

  vi.spyOn(globalThis, "queueMicrotask").mockImplementation((task) => {
    try {
      task();
    } catch (error) {
      reported.push(error);
    }
  });

  const failure = new Error("cleanup");
  const after = vi.fn();
  const clock = createTestClock();

  const reach = new Reach({
    clock,
    adapter: {
      name: "throwing",
      open: (context) => {
        context.onDispose(after);
        context.onDispose(() => {
          throw failure;
        });

        return { native: null, capabilities: MOCK_CAPABILITIES };
      },
    },
  });

  reach.start();
  reach.dispose();

  expect(reported).toEqual([failure]);
  expect(after).toHaveBeenCalledTimes(1);
  expect(reach.status.get().state).toBe("disposed");
});
