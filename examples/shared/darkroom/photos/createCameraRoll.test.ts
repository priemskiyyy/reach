import { expect, test } from "vitest";

import { createCameraRoll } from "example-shared/darkroom/photos/createCameraRoll";

test("the roll starts with three photos already in Inês's library and nothing waiting", () => {
  const roll = createCameraRoll();

  expect(roll.photos.get()).toHaveLength(3);
  expect(roll.photos.get().map(({ backup }) => backup)).toEqual([
    { state: "backed-up", account: "ines" },
    { state: "backed-up", account: "ines" },
    { state: "backed-up", account: "ines" },
  ]);
  expect(roll.nextWaiting()).toBeUndefined();
});

test("a new photo lands first and waits, and the oldest waiting photo goes first", () => {
  const roll = createCameraRoll();

  const first = roll.take();
  const second = roll.take();

  expect(roll.photos.get().slice(0, 2)).toEqual([second, first]);
  expect(first).toMatchObject({
    title: "Tram in the rain",
    backup: { state: "waiting" },
  });
  expect(roll.countWaiting()).toBe(2);
  expect(roll.nextWaiting()).toBe(first);

  roll.update(first.id, { state: "backed-up", account: "kofi" });

  expect(roll.nextWaiting()).toEqual(second);
  expect(roll.countWaiting()).toBe(1);
});
