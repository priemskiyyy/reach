import { expect, test } from "vitest";

import { Transaction } from "src/utils/internal/observable/Transaction";
import { ValueStore } from "src/utils/internal/observable/ValueStore";

test("T063 every store of a transaction is installed before its first listener runs", () => {
  const generation = new ValueStore(1);
  const available = new ValueStore(true);
  const seen: Array<[number, boolean]> = [];

  generation.subscribe(() => seen.push([generation.get(), available.get()]));

  const transaction = new Transaction();

  transaction.set(generation, 2);
  transaction.set(available, false);

  expect(seen).toEqual([]);

  transaction.commit();
  expect(seen).toEqual([[2, false]]);
});

test("a store set to its current value is not notified", () => {
  const store = new ValueStore(1);
  const seen: number[] = [];

  store.subscribe(() => seen.push(store.get()));

  const transaction = new Transaction();

  transaction.set(store, 1);
  transaction.commit();

  expect(seen).toEqual([]);
});
