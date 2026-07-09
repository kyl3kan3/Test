import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

/**
 * Not a test — a screenshot tour of the real app (web export) for previewing.
 * Run explicitly: npx playwright test screenshots --config e2e/playwright.config.ts
 */

const OUT = process.env.SHOT_DIR ?? "e2e/screens";
const API = "http://localhost:3000";

async function shot(page: Page, name: string) {
  await page.waitForTimeout(1400); // let entrance animations fully settle
  await page.screenshot({ path: `${OUT}/${name}.png` });
}

async function lastOtp(page: Page): Promise<string> {
  const res = await page.request.post(`${API}/api/test/last-otp`);
  const body = (await res.json()) as { otp: string };
  return body.otp;
}

test("screenshot tour", async ({ page }) => {
  test.setTimeout(180_000);
  mkdirSync(OUT, { recursive: true });
  const email = `tour-${Date.now()}@test.dev`;

  await page.goto("/");
  await expect(page.getByTestId("onboarding-start")).toBeVisible();
  await shot(page, "01-hook");

  await page.getByTestId("onboarding-start").click();
  await expect(page.getByTestId("quiz-0-option-0")).toBeVisible();
  await shot(page, "02-quiz");
  await page.getByTestId("quiz-0-option-0").click();

  for (let step = 1; step < 7; step++) {
    await expect(page.getByTestId(`quiz-${step}-option-0`)).toBeVisible();
    if (step === 4) await shot(page, "03-quiz-tone");
    await page.getByTestId(`quiz-${step}-option-0`).click();
    const next = page.getByTestId(`quiz-${step}-next`);
    if (await next.isVisible().catch(() => false)) await next.click();
  }

  await expect(page.getByTestId("building-continue")).toBeVisible({ timeout: 10_000 });
  await shot(page, "04-archetype");
  await page.getByTestId("building-continue").click();

  await expect(page.getByTestId("signup-email")).toBeVisible();
  await page.getByTestId("signup-email").fill(email);
  await shot(page, "05-signup");
  await page.getByTestId("signup-send").click();

  await expect(page.getByTestId("verify-otp")).toBeVisible();
  await shot(page, "06-verify");
  await page.getByTestId("verify-otp").fill(await lastOtp(page));

  await expect(page.getByTestId("paywall-continue")).toBeVisible({ timeout: 15_000 });
  await shot(page, "07-paywall");
  await page.getByTestId("paywall-continue").click();

  await expect(page.getByTestId("home-task-input")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("home-task-input").fill("the permission slip pile on the counter");
  await page.getByTestId("home-energy-1").click();
  await shot(page, "08-home");
  await page.getByTestId("home-breakdown").click();

  await expect(page.getByTestId("task-vibecheck")).toBeVisible({ timeout: 15_000 });
  await shot(page, "09-breakdown");
  await page.getByTestId("task-start").click();

  await expect(page.getByTestId("session-step-title")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("coach-line")).toContainText("You've got this", {
    timeout: 15_000,
  });
  await page.waitForTimeout(3200); // let the timer tick a bit
  await shot(page, "10-session");

  for (let i = 0; i < 6; i++) {
    const celebrated = await page
      .getByTestId("celebrate-headline")
      .isVisible()
      .catch(() => false);
    if (celebrated) break;
    const done = page.getByTestId("session-done");
    if (await done.isVisible().catch(() => false)) {
      await done.click();
    }
    await page.waitForTimeout(900);
  }

  await expect(page.getByTestId("celebrate-headline")).toBeVisible({ timeout: 15_000 });
  await shot(page, "11-celebrate");

  await page.getByTestId("celebrate-home").click();
  await expect(page.locator('[data-testid="home-streak"]:visible')).toContainText("1", {
    timeout: 15_000,
  });
  await page.locator('[data-testid="home-streak"]:visible').click();
  await expect(page.getByTestId("streak-current")).toBeVisible({ timeout: 15_000 });
  await shot(page, "12-streak");

  await page.getByTestId("streak-back").click();
  await page.locator('[data-testid="home-recap"]:visible').click();
  await expect(page.getByTestId("recap-oneliner")).toBeVisible({ timeout: 15_000 });
  await shot(page, "13-recap");

  await page.getByTestId("recap-back").click();
  await page.locator('[data-testid="home-settings"]:visible').click();
  await expect(page.getByTestId("settings-tone-gentle_cheerleader")).toBeVisible({
    timeout: 15_000,
  });
  await shot(page, "14-settings");
});
