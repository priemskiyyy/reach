import { expect, test, vi } from "vitest";

import type { ObservableValue } from "src/types/ObservableValue";
import { DerivedValue } from "src/utils/internal/observable/DerivedValue";
import { ValueStore } from "src/utils/internal/observable/ValueStore";

const countSubscriptions = <TValue>(source: ObservableValue<TValue>) => {
  const counter = { active: 0, total: 0 };

  const observable: ObservableValue<TValue> = {
    get: source.get,
    subscribe: (listener) => {
      counter.active += 1;
      counter.total += 1;

      const unsubscribe = source.subscribe(listener);

      return () => {
        counter.active -= 1;
        unsubscribe();
      };
    },
  };

  return { observable, counter };
};

test("a derived value computes again only when a source value changed", () => {
  const store = new ValueStore(1);
  const compute = vi.fn(() => store.get() * 2);
  const derived = new DerivedValue({ sources: [store.observable], compute });

  expect(derived.get()).toBe(2);
  expect(derived.get()).toBe(2);
  expect(compute).toHaveBeenCalledTimes(1);

  store.update(2);

  expect(derived.get()).toBe(4);
  expect(compute).toHaveBeenCalledTimes(2);
});

test("an equal result keeps the previous identity", () => {
  const store = new ValueStore(1);

  const derived = new DerivedValue({
    sources: [store.observable],
    compute: () => ({ even: store.get() % 2 === 0 }),
    isEqual: (previous, next) => previous.even === next.even,
  });

  const first = derived.get();

  store.update(3);

  expect(derived.get()).toBe(first);
});

test("T062 an unobserved derived value reads current values and keeps no subscription", () => {
  const store = new ValueStore(1);
  const { observable, counter } = countSubscriptions(store.observable);

  const derived = new DerivedValue({
    sources: [observable],
    compute: () => observable.get() + 1,
  });

  store.update(5);

  expect(derived.get()).toBe(6);
  expect(counter.total).toBe(0);
});

test("an observed derived value holds one subscription per distinct source until its last listener leaves", () => {
  const store = new ValueStore(1);
  const { observable, counter } = countSubscriptions(store.observable);

  const derived = new DerivedValue({
    sources: [observable, observable],
    compute: () => observable.get(),
  });

  const first = derived.subscribe(() => {});
  const second = derived.subscribe(() => {});

  expect(counter.active).toBe(1);

  first();
  expect(counter.active).toBe(1);

  second();
  second();
  expect(counter.active).toBe(0);
});

test("a derived value notifies only when its own value changes", () => {
  const store = new ValueStore(1);
  const listener = vi.fn();

  const derived = new DerivedValue({
    sources: [store.observable],
    compute: () => store.get() > 10,
  });

  derived.subscribe(listener);
  store.update(2);
  store.update(11);
  store.update(12);

  expect(listener).toHaveBeenCalledTimes(1);
});

test("T063 a listener of the source reads the derived value of the same change", () => {
  const store = new ValueStore(1);

  const derived = new DerivedValue({
    sources: [store.observable],
    compute: () => store.get() * 10,
  });

  const seen: number[] = [];

  store.subscribe(() => seen.push(derived.get()));
  derived.subscribe(() => {});
  store.update(2);

  expect(seen).toEqual([20]);
});

test("a diamond notifies its dependent once and never with a mixed read", () => {
  const store = new ValueStore(1);

  const left = new DerivedValue({
    sources: [store.observable],
    compute: () => store.get() + 1,
  });

  const right = new DerivedValue({
    sources: [store.observable],
    compute: () => store.get() * 2,
  });

  const both = new DerivedValue({
    sources: [left.observable, right.observable],
    compute: () => [left.get(), right.get()],
  });

  const seen: number[][] = [];

  both.subscribe(() => seen.push(both.get()));
  store.update(3);

  expect(seen).toEqual([[4, 6]]);
});

test("a derived value that reads itself fails instead of recursing", () => {
  const holder: { derived: DerivedValue<number> | null } = { derived: null };

  const derived = new DerivedValue({
    sources: [],
    compute: () => (holder.derived === null ? 0 : holder.derived.get()),
  });

  holder.derived = derived;

  expect(() => derived.get()).toThrow(
    expect.objectContaining({ code: "EVALUATION_ERROR" }),
  );
});

test("a source whose subscribe throws leaves no other subscription behind", () => {
  const store = new ValueStore(1);
  const good = countSubscriptions(store.observable);
  const failure = new Error("subscribe");
  let broken = true;

  const bad: ObservableValue<number> = {
    get: () => 2,
    subscribe: (listener) => {
      if (broken) {
        throw failure;
      }

      return store.subscribe(listener);
    },
  };

  const derived = new DerivedValue({
    sources: [good.observable, bad],
    compute: () => store.get() + bad.get(),
  });

  const listener = vi.fn();

  expect(() => derived.subscribe(listener)).toThrow(failure);
  expect(good.counter.active).toBe(0);

  broken = false;
  derived.subscribe(listener);
  store.update(5);

  expect(good.counter.active).toBe(1);
  expect(listener).toHaveBeenCalledTimes(1);
});

test("an unsubscribe that throws is reported, and every other source is still left", () => {
  const reported: unknown[] = [];

  vi.spyOn(globalThis, "queueMicrotask").mockImplementation((task) => {
    try {
      task();
    } catch (error) {
      reported.push(error);
    }
  });

  const store = new ValueStore(1);
  const good = countSubscriptions(store.observable);
  const failure = new Error("unsubscribe");

  const bad: ObservableValue<number> = {
    get: () => 2,
    subscribe: () => () => {
      throw failure;
    },
  };

  const derived = new DerivedValue({
    sources: [bad, good.observable],
    compute: () => store.get() + bad.get(),
  });

  derived.subscribe(() => {})();

  expect(good.counter.active).toBe(0);
  expect(reported).toEqual([failure]);
});
