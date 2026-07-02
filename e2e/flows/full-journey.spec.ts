import { expect, test, type Page } from "@playwright/test";

const API = "http://localhost:3000";

async function lastOtp(page: Page): Promise<string> {
  const res = await page.request.post(`${API}/api/test/last-otp`);
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { otp: string };
  return body.otp;
}

/**
 * Flow A: quiz -> tease -> signup -> OTP -> hard paywall -> (stub) purchase -> home
 * Flow B: task -> breakdown -> focus session -> all steps -> celebration -> streak
 * Runs as one journey — exactly what a new user does on day one.
 */
test("new user: onboarding to first completed task", async ({ page }) => {
  const email = `e2e-${Date.now()}@test.dev`;

  await page.goto("/");

  // --- Onboarding hook + 7-step quiz ---
  await expect(page.getByTestId("onboarding-start")).toBeVisible();
  await page.getByTestId("onboarding-start").click();

  for (let step = 0; step < 7; step++) {
    await expect(page.getByTestId(`quiz-${step}-option-0`)).toBeVisible();
    await page.getByTestId(`quiz-${step}-option-0`).click();
    // multi-select steps (2 and 3) need the explicit Next button
    const next = page.getByTestId(`quiz-${step}-next`);
    if (await next.isVisible().catch(() => false)) {
      await next.click();
    }
  }

  // --- Value tease interstitial ---
  await expect(page.getByTestId("building-continue")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/You're a/)).toBeVisible();
  await page.getByTestId("building-continue").click();

  // --- Signup with email OTP ---
  await page.getByTestId("signup-email").fill(email);
  await page.getByTestId("signup-send").click();
  await expect(page.getByTestId("verify-otp")).toBeVisible();
  const otp = await lastOtp(page);
  await page.getByTestId("verify-otp").fill(otp);

  // --- Hard paywall: no skip, compliance links present ---
  await expect(page.getByTestId("paywall-continue")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("paywall-restore")).toBeVisible();
  await expect(page.getByTestId("paywall-terms")).toBeVisible();
  await expect(page.getByTestId("paywall-privacy")).toBeVisible();
  await expect(page.getByTestId("paywall-signin")).toBeVisible();
  await page.getByTestId("paywall-continue").click();

  // --- Home ---
  await expect(page.getByTestId("home-task-input")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("home-streak")).toContainText("0");

  // --- Breakdown ---
  await page.getByTestId("home-task-input").fill("clean my desk");
  await page.getByTestId("home-energy-1").click();
  await page.getByTestId("home-breakdown").click();

  // Task screen with mock plan (4 steps, starter first)
  await expect(page.getByTestId("task-vibecheck")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("step-title-0")).toContainText("Stand up");
  await expect(page.getByTestId("step-title-3")).toContainText("Wipe the surface");

  // --- Focus session ---
  await page.getByTestId("task-start").click();
  await expect(page.getByTestId("session-step-title")).toContainText("Stand up", {
    timeout: 15_000,
  });
  await expect(page.getByTestId("session-timer")).toBeVisible();

  // The mock coach streams a line
  await expect(page.getByTestId("coach-line")).toContainText("You've got this", {
    timeout: 15_000,
  });

  // Complete all 4 steps
  for (let i = 0; i < 4; i++) {
    await expect(page.getByTestId("session-done")).toBeVisible();
    await page.getByTestId("session-done").click();
    await page.waitForTimeout(400);
  }

  // --- Celebration ---
  await expect(page.getByTestId("celebrate-headline")).toContainText(
    "You did the thing.",
    { timeout: 15_000 },
  );
  await expect(page.getByTestId("confetti")).toBeVisible();
  await expect(page.getByTestId("celebrate-streak")).toContainText("1");

  // --- Back home: streak is alive, task is done (not in pick-back-up) ---
  await page.getByTestId("celebrate-home").click();
  // router.replace can briefly keep the previous Home mounted — assert on the visible one.
  await expect(page.locator('[data-testid="home-streak"]:visible')).toContainText("1", {
    timeout: 15_000,
  });
});

test("returning subscriber lands on home after sign-in", async ({ page }) => {
  const email = `e2e-return-${Date.now()}@test.dev`;

  // Seed: create the account via API (OTP flow), marking onboarding done.
  const send = await page.request.post(
    `${API}/api/auth/email-otp/send-verification-otp`,
    { data: { email, type: "sign-in" } },
  );
  expect(send.ok()).toBeTruthy();

  await page.goto("/");
  await expect(page.getByTestId("onboarding-start")).toBeVisible();
  await page.getByTestId("onboarding-login").click();

  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-send").click();
  await expect(page.getByTestId("verify-otp")).toBeVisible();
  const otp2 = await lastOtp(page);
  await page.getByTestId("verify-otp").fill(otp2);

  // Paywall (stub) then home
  await expect(page.getByTestId("paywall-continue")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("paywall-continue").click();
  await expect(page.getByTestId("home-task-input")).toBeVisible({ timeout: 15_000 });
});
