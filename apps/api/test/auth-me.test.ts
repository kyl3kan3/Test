import { beforeEach, describe, expect, it } from "vitest";
import { app, authed, resetDb, signup } from "./helpers";

describe("auth + /api/me", () => {
  beforeEach(resetDb);

  it("health endpoint responds", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    const body = ((await res.json()) as any) as any;
    expect(body.ok).toBe(true);
  });

  it("rejects unauthenticated /api/me", async () => {
    const res = await app.request("/api/me");
    expect(res.status).toBe(401);
  });

  it("signs up via email OTP and reads profile", async () => {
    const { cookie, email } = await signup();
    const res = await app.request("/api/me", authed(cookie));
    expect(res.status).toBe(200);
    const body = ((await res.json()) as any) as any;
    expect(body.email).toBe(email);
    expect(body.subscription).toBeNull();
    expect(body.streak.currentStreak).toBe(0);
  });

  it("patches quiz answers, tone, timezone and onboarded", async () => {
    const { cookie } = await signup();
    const patch = await app.request(
      "/api/me",
      authed(cookie, {
        method: "PATCH",
        body: JSON.stringify({
          coachTone: "chaotic_bestie",
          timezone: "America/New_York",
          quizAnswers: { hypeStyle: "chaotic", worstTaskTypes: ["cleaning"] },
          onboarded: true,
        }),
      }),
    );
    expect(patch.status).toBe(200);

    const res = await app.request("/api/me", authed(cookie));
    const body = ((await res.json()) as any) as any;
    expect(body.coachTone).toBe("chaotic_bestie");
    expect(body.timezone).toBe("America/New_York");
    expect(body.quizAnswers.worstTaskTypes).toEqual(["cleaning"]);
    expect(body.onboardedAt).toBeTruthy();
  });

  it("rejects invalid coach tone", async () => {
    const { cookie } = await signup();
    const patch = await app.request(
      "/api/me",
      authed(cookie, {
        method: "PATCH",
        body: JSON.stringify({ coachTone: "drill_sergeant" }),
      }),
    );
    expect(patch.status).toBe(400);
  });

  it("deletes the account and invalidates access", async () => {
    const { cookie } = await signup();
    const del = await app.request("/api/me", authed(cookie, { method: "DELETE" }));
    expect(del.status).toBe(200);
    const res = await app.request("/api/me", authed(cookie));
    expect(res.status).toBe(401);
  });
});
