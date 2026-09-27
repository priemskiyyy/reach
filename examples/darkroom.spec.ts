import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const WIDTHS = [375, 1280];

const open = async (page: Page, width: number) => {
  const errors: string[] = [];

  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/");
  await expect(
    page.getByRole("banner").getByText("Running", { exact: true }),
  ).toBeVisible();
  await expect(latestCheck(page)).toContainText("Check #1 passed");

  return errors;
};

const latestCheck = (page: Page) =>
  page.getByRole("region", { name: "Latest check" });

const photo = (page: Page, title: string) =>
  page
    .getByRole("list", { name: "Photos" })
    .getByRole("listitem", { name: title });

const fact = (page: Page, label: string) =>
  page.getByRole("list", { name: "Facts" }).getByRole("listitem", {
    name: label,
  });

const run = (page: Page) =>
  page.getByRole("region", { name: "Darkroom" }).getByRole("status");

const strip = (page: Page) =>
  page.getByRole("group", { name: "Automatic backup" });

const hasHorizontalScroll = (page: Page) =>
  page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );

for (const width of WIDTHS) {
  test(`a new photo backs up on its own without errors or horizontal scroll at ${width}px`, async ({
    page,
  }, testInfo) => {
    const errors = await open(page, width);

    await page.getByRole("button", { name: "Take photo" }).click();

    await expect(photo(page, "Tram in the rain")).toContainText("Backed up");
    await expect(run(page)).toContainText("Backed up 1 photo to Inês Duarte.");
    await expect(hasHorizontalScroll(page)).resolves.toBe(false);

    await page.screenshot({
      path: testInfo.outputPath(`darkroom-${width}.png`),
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
}

test("on cellular automatic backup pauses for metering, and Back up now sends the photo", async ({
  page,
}) => {
  const errors = await open(page, 1280);

  await page.getByRole("button", { name: "Cellular" }).click();
  await page.getByRole("button", { name: "Take photo" }).click();

  await expect(strip(page)).toContainText("Paused: the connection is metered.");
  await expect(photo(page, "Tram in the rain")).toContainText("Waiting");

  await page.getByRole("button", { name: "Back up now" }).click();

  await expect(photo(page, "Tram in the rain")).toContainText("Backed up");
  expect(errors).toEqual([]);
});

test("behind a hotel's sign-in page internet is unknown, never offline, and Back up now refuses", async ({
  page,
}) => {
  const errors = await open(page, 1280);

  await page.getByRole("button", { name: "Hotel Wi-Fi" }).click();

  await expect(fact(page, "Internet")).toContainText("Unknown");
  await expect(latestCheck(page)).toContainText("Unavailable");

  await page.getByRole("button", { name: "Take photo" }).click();
  await page.getByRole("button", { name: "Back up now" }).click();

  await expect(run(page)).toContainText(
    "Not now: the API's last check failed.",
  );
  expect(errors).toEqual([]);
});

test("two callers asking at once share one check and one request", async ({
  page,
}) => {
  const errors = await open(page, 1280);
  const network = page.getByRole("region", { name: "Network", exact: true });

  await network.getByRole("button", { name: "Clear" }).click();
  await page.getByRole("button", { name: "Check twice at once" }).click();

  await expect(
    page.getByRole("status", { name: "Check result" }),
  ).toContainText("2 callers, one request");
  await expect(network.getByRole("listitem")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("this browser's own offline mode reaches the real browser adapter", async ({
  page,
  context,
}) => {
  const errors = await open(page, 1280);

  await page.getByRole("button", { name: "This browser" }).click();

  await expect(fact(page, "Connection")).toContainText("Connected");
  await expect(fact(page, "Metered")).toContainText("Unsupported");

  await context.setOffline(true);

  await expect(fact(page, "Connection")).toContainText("Disconnected");
  await expect(fact(page, "Connection")).toContainText("Browser hint");

  await context.setOffline(false);

  await expect(fact(page, "Connection")).toContainText("Connected");
  expect(errors).toEqual([]);
});
