import { Reach } from "@priemskiyyy/reach";
import {
  createMockEndpoint,
  createMockNetwork,
  createTestClock,
  observed,
} from "@priemskiyyy/reach/mock";
import { expect, test } from "vitest";

import {
  createFakeCondition,
  createFakeOnlineManager,
} from "src/fakes.fixture";
import { toOnlineEventListener } from "src/toOnlineEventListener";

test("creating the listener subscribes to nothing and publishes nothing", () => {
  const fake = createFakeCondition("met");
  const manager = createFakeOnlineManager();

  toOnlineEventListener(fake.condition);

  expect(fake.listenerCount()).toBe(0);
  expect(manager.calls).toEqual([]);
});

test("met is online and unmet offline, from setup on", () => {
  const fake = createFakeCondition("met");
  const manager = createFakeOnlineManager();

  manager.setEventListener(toOnlineEventListener(fake.condition));
  fake.set("unmet");
  fake.set("met");

  expect(manager.calls).toEqual([true, false, true]);
});

test("T151 unknown is online by default and offline when asked", () => {
  const permissive = createFakeOnlineManager();
  const strict = createFakeOnlineManager();

  permissive.setEventListener(
    toOnlineEventListener(createFakeCondition("unknown").condition),
  );
  strict.setEventListener(
    toOnlineEventListener(createFakeCondition("unknown").condition, {
      unknown: "offline",
    }),
  );

  expect(permissive.calls).toEqual([true]);
  expect(strict.calls).toEqual([false]);
});

test("T151 preserve publishes nothing while unknown, setup included", () => {
  const fake = createFakeCondition("unknown");
  const manager = createFakeOnlineManager();

  manager.setEventListener(
    toOnlineEventListener(fake.condition, { unknown: "preserve" }),
  );

  expect(manager.calls).toEqual([]);

  fake.set("unmet");
  fake.set("unknown");
  fake.set("unmet");

  expect(manager.calls).toEqual([false]);
});

test("the same Boolean is never published twice", () => {
  const fake = createFakeCondition("met");
  const manager = createFakeOnlineManager();

  manager.setEventListener(toOnlineEventListener(fake.condition));
  fake.set("unknown");
  fake.set("met");

  expect(manager.calls).toEqual([true]);
});

test("T152 a replaced installation stops publishing, and its late cleanup touches nothing", () => {
  const first = createFakeCondition("met");
  const second = createFakeCondition("unmet");
  const manager = createFakeOnlineManager();

  const setup = toOnlineEventListener(first.condition);
  const cleanups: Array<() => void> = [];

  manager.setEventListener((setOnline) => {
    const cleanup = setup(setOnline);

    cleanups.push(cleanup);

    return cleanup;
  });
  manager.setEventListener(toOnlineEventListener(second.condition));

  expect(first.listenerCount()).toBe(0);

  first.set("unmet");
  cleanups.forEach((cleanup) => cleanup());
  second.set("met");

  expect(manager.calls).toEqual([true, false, true]);
  expect(second.listenerCount()).toBe(1);
});

test("T153 a change between subscribing and the first read is not missed", () => {
  const fake = createFakeCondition("met");
  const manager = createFakeOnlineManager();

  fake.hooks.onSubscribe = () => fake.set("unmet");

  manager.setEventListener(toOnlineEventListener(fake.condition));

  expect(manager.calls.at(-1)).toBe(false);
});

test("a change made while publishing ends on the latest answer", () => {
  const fake = createFakeCondition("met");
  const manager = createFakeOnlineManager();

  manager.hooks.onSetOnline = (online) => {
    if (online) {
      fake.set("unmet");
    }
  };

  manager.setEventListener(toOnlineEventListener(fake.condition));

  expect(manager.calls).toEqual([true, false]);
});

test("a notification already under way when the cleanup runs publishes nothing", () => {
  const fake = createFakeCondition("met");
  const manager = createFakeOnlineManager();
  const cleanups: Array<() => void> = [];

  // Registered first, so it runs its cleanup before the bridge hears the change.
  fake.condition.subscribe(() => cleanups.forEach((cleanup) => cleanup()));

  const setup = toOnlineEventListener(fake.condition);

  manager.setEventListener((setOnline) => {
    const cleanup = setup(setOnline);

    cleanups.push(cleanup);

    return cleanup;
  });
  fake.set("unmet");

  expect(manager.calls).toEqual([true]);
});

test("a Reach condition drives the manager as its evidence changes", async () => {
  const mock = createMockNetwork();
  const manager = createFakeOnlineManager();

  const network = new Reach({
    adapter: mock.adapter,
    clock: createTestClock(),
  });

  manager.setEventListener(
    toOnlineEventListener(network.condition({ internet: "online" })),
  );

  await network.start().ready;

  mock.emit({ internet: { status: observed("offline", "native-path") } });
  mock.emit({ internet: { status: observed("online", "native-validation") } });

  expect(manager.calls).toEqual([true, false, true]);
});

test("T154 one endpoint's failure never takes Query offline", async () => {
  const mock = createMockNetwork({
    initial: {
      internet: { status: observed("online", "native-validation") },
    },
  });

  const probe = createMockEndpoint({ staleAfter: 30_000 });
  const manager = createFakeOnlineManager();

  const network = new Reach({
    adapter: mock.adapter,
    clock: createTestClock(),
    endpoints: { api: probe.definition },
  });

  manager.setEventListener(
    toOnlineEventListener(network.condition({ internet: "online" })),
  );

  await network.start().ready;

  const checking = network.endpoint("api").check();

  probe.fail("server-error");
  await checking;

  expect(network.endpoint("api").state.get().status).toBe("unavailable");
  expect(manager.calls).toEqual([true]);
});
