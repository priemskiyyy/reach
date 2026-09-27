import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { startDarkroom } from "example-shared/darkroom/runtime/startDarkroom";
import type { DarkroomRuntime } from "example-shared/darkroom/runtime/types/DarkroomRuntime";
import { Application } from "src/Application";

class IntersectionObserverStub {
  observe() {}

  disconnect() {}
}

const runtimes: DarkroomRuntime[] = [];

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
});

afterEach(() => {
  cleanup();

  for (const runtime of runtimes.splice(0)) {
    runtime.dispose();
  }

  vi.unstubAllGlobals();
});

const renderApplication = async () => {
  const { services, runtime } = startDarkroom({ latency: 0 });

  runtimes.push(runtime);
  render(<Application services={services} runtime={runtime} />);

  await waitFor(() => {
    expect(readLatestCheck()).toContain("Check #1 passed");
  });

  return { services, runtime };
};

const press = (name: string) => {
  fireEvent.click(screen.getByRole("button", { name }));
};

const isPressed = (name: string) =>
  screen.getByRole("button", { name }).getAttribute("aria-pressed") === "true";

const region = (name: string) => screen.getByRole("region", { name });

const item = (list: string, name: string) =>
  within(screen.getByRole("list", { name })).getByRole("listitem", {
    name: list,
  });

const readPhoto = (title: string) => item(title, "Photos").textContent;

const readFact = (label: string) => item(label, "Facts").textContent;

const readCondition = (title: string) => item(title, "Conditions").textContent;

const readLatestCheck = () => region("Latest check").textContent;

const readStrip = () =>
  screen.getByRole("group", { name: "Automatic backup" }).textContent;

const readRun = () =>
  within(region("Darkroom")).getByRole("status").textContent;

const readRequests = () =>
  within(region("Network"))
    .queryAllByRole("listitem")
    .map(({ textContent }) => textContent);

test("Darkroom opens healthy: Inês signed in, reading the simulated phone, and the API checked for her", async () => {
  await renderApplication();

  expect(isPressed("Inês Duarte")).toBe(true);
  expect(isPressed("Simulated phone")).toBe(true);
  expect(isPressed("Automatic backup")).toBe(true);
  expect(readLatestCheck()).toContain("Available");
  expect(readFact("Internet")).toContain("Online");
  expect(readFact("Internet")).toContain("Native validation");
  expect(readCondition("Automatic backup")).toContain("Met");
  expect(readStrip()).toContain("New photos back up on their own");
});

test("a new photo backs up on its own, and the run says where it went", async () => {
  await renderApplication();

  press("Take photo");

  await waitFor(() => {
    expect(readPhoto("Tram in the rain")).toContain("Backed up");
  });
  expect(readPhoto("Tram in the rain")).toContain("In Inês Duarte's library");
  expect(readRun()).toContain("Automatic backup");
  expect(readRun()).toContain("Backed up 1 photo to Inês Duarte.");
  expect(readRequests()[0]).toContain("PUT /photos/4");
});

test("on cellular automatic backup pauses for metering, and Back up now still sends the photo", async () => {
  await renderApplication();

  press("Cellular");
  press("Take photo");

  expect(readStrip()).toContain("Paused: the connection is metered.");
  expect(readPhoto("Tram in the rain")).toContain("Waiting");

  press("Back up now");

  await waitFor(() => {
    expect(readPhoto("Tram in the rain")).toContain("Backed up");
  });
  expect(readRun()).toContain("Back up now");
  expect(readRun()).toContain("Backed up 1 photo to Inês Duarte.");
});

test("behind a hotel's sign-in page internet is unknown, not offline, and the API's failed check refuses Back up now", async () => {
  await renderApplication();

  press("Hotel Wi-Fi");

  await waitFor(
    () => {
      expect(readCondition("API available")).toContain("Unmet");
    },
    { timeout: 4_000 },
  );
  expect(readFact("Internet")).toContain("Unknown");
  expect(readFact("Internet")).toContain(
    "The source could not tell whether the internet is reachable.",
  );
  expect(readCondition("Online")).toContain("Unknown");
  expect(readLatestCheck()).toContain(
    "failed: the request failed before any answer arrived",
  );

  press("Take photo");
  press("Back up now");

  expect(readRun()).toContain("Not now: the API's last check failed.");
  expect(readPhoto("Tram in the rain")).toContain("Waiting");
});

test("signed out, the API is not checked and Back up now asks to sign in", async () => {
  await renderApplication();

  press("Signed out");

  expect(readLatestCheck()).toContain("Nobody is signed in");
  expect(readStrip()).toContain(
    "nobody is signed in, so the API is not checked",
  );

  press("Take photo");
  press("Back up now");

  expect(readRun()).toContain("Sign in to back up your photos.");
});

test("two callers asking at once share one check and one request", async () => {
  await renderApplication();

  fireEvent.click(
    within(region("Network")).getByRole("button", { name: "Clear" }),
  );
  press("Check twice at once");

  await waitFor(() => {
    expect(
      screen.getByRole("status", { name: "Check result" }).textContent,
    ).toContain("2 callers, one request: Check #2 passed.");
  });
  expect(readRequests()).toHaveLength(1);
  expect(readRequests()[0]).toContain("GET /health");
});

test("an invalidated API is unknown, so Back up now tries and lets the upload answer", async () => {
  await renderApplication();

  press("Automatic backup");
  press("Take photo");
  press("Invalidate");

  expect(readStrip()).toContain("New photos wait for Back up now");
  expect(readLatestCheck()).toContain(
    "Check #1 passed, but it no longer counts: it was dropped.",
  );
  expect(
    within(item("Back up now", "Decisions")).getByRole("listitem", {
      current: true,
    }).textContent,
  ).toContain("Tries");

  press("Back up now");

  await waitFor(() => {
    expect(readPhoto("Tram in the rain")).toContain("Backed up");
  });
});

test("an offline API fails the upload, and Darkroom checks again instead of retrying", async () => {
  await renderApplication();

  press("API offline");
  press("Take photo");

  await waitFor(() => {
    expect(readRun()).toContain(
      "The upload failed: Error: The photos API answered 503. Darkroom checks the API again.",
    );
  });
  await waitFor(() => {
    expect(readLatestCheck()).toContain("Unavailable");
  });
  expect(readStrip()).toContain("Paused: the API's last check failed.");
  expect(
    readRequests().filter((request) => request?.includes("PUT")),
  ).toHaveLength(1);
});

test("reading this browser, metering cannot be told, so automatic backup waits", async () => {
  await renderApplication();

  press("This browser");

  expect(isPressed("This browser")).toBe(true);

  await waitFor(() => {
    expect(readFact("Metered")).toContain("Unsupported");
  });
  expect(readFact("Metered")).toContain(
    "This source cannot tell whether the connection is metered.",
  );
  expect(readStrip()).toContain(
    "Waiting, because nothing can tell yet: this source cannot tell whether the connection is metered",
  );
});

test("reading the network again answers unchanged, and the timeline tells the session", async () => {
  await renderApplication();

  press("Read again");

  await waitFor(() => {
    expect(region("Facts from Simulated phone").textContent).toContain(
      "Unchanged",
    );
  });

  const events = within(
    screen.getByRole("list", { name: "Timeline events" }),
  ).getAllByRole("listitem");

  expect(events.map(({ textContent }) => textContent).join(" ")).toContain(
    "Session opened",
  );
});
