import { expect, test, vi } from "vitest";

import { createDeferred } from "src/utils/internal/common/createDeferred";
import { waitWithSignal } from "src/utils/internal/common/waitWithSignal";

test("a wait without a signal is the shared promise itself", () => {
  const { promise } = createDeferred<number>();

  expect(waitWithSignal(promise, undefined)).toBe(promise);
});

test("T096 an already aborted signal rejects at once", async () => {
  const { promise } = createDeferred<number>();
  const onAbort = vi.fn();
  const controller = new AbortController();

  controller.abort();

  await expect(
    waitWithSignal(promise, controller.signal, onAbort),
  ).rejects.toMatchObject({ code: "ABORTED" });
  expect(onAbort).toHaveBeenCalledTimes(1);
});

test("T094 aborting ends this wait and leaves the shared work alone", async () => {
  const shared = createDeferred<number>();
  const controller = new AbortController();
  const aborted = waitWithSignal(shared.promise, controller.signal);
  const other = waitWithSignal(shared.promise, new AbortController().signal);

  controller.abort();
  shared.resolve(7);

  await expect(aborted).rejects.toMatchObject({ code: "ABORTED" });
  await expect(other).resolves.toBe(7);
});

test("the abort listener is removed once the work settles", async () => {
  const shared = createDeferred<number>();
  const controller = new AbortController();
  const remove = vi.spyOn(controller.signal, "removeEventListener");
  const wait = waitWithSignal(shared.promise, controller.signal);

  shared.resolve(1);
  await wait;

  expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
});
