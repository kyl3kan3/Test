import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app, authed, db, grantPro, resetDb, schema, signup } from "./helpers";
import { tickStreak } from "../src/lib/streaks";

const TZ = "America/New_York";

async function setTz(cookie: string) {
  await app.request(
    "/api/me",
    authed(cookie, { method: "PATCH", body: JSON.stringify({ timezone: TZ }) }),
  );
}

describe("streak engine", () => {
  beforeEach(resetDb);
  afterEach(() => vi.useRealTimers());

  it("starts at 1, is idempotent same-day, increments next day", async () => {
    const { userId } = await signup();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T18:00:00Z"));

    let s = await tickStreak(userId, TZ);
    expect(s.currentStreak).toBe(1);

    s = await tickStreak(userId, TZ);
    expect(s.currentStreak).toBe(1); // same local day

    vi.setSystemTime(new Date("2026-07-02T18:00:00Z"));
    s = await tickStreak(userId, TZ);
    expect(s.currentStreak).toBe(2);
    expect(s.longestStreak).toBe(2);
  });

  it("auto-covers a single missed day with a banked freeze", async () => {
    const { userId } = await signup();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T18:00:00Z"));
    await tickStreak(userId, TZ); // streak 1, freezesAvailable starts at 1

    // Skip July 2 entirely; tick on July 3.
    vi.setSystemTime(new Date("2026-07-03T18:00:00Z"));
    const s = await tickStreak(userId, TZ);
    expect(s.usedFreeze).toBe(true);
    expect(s.currentStreak).toBe(2);
    expect(s.freezesAvailable).toBe(0);

    const days = await db.select().from(schema.streakDays);
    expect(days.find((d) => d.day === "2026-07-02")?.kind).toBe("freeze");
  });

  it("resets after a two-day gap", async () => {
    const { userId } = await signup();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T18:00:00Z"));
    await tickStreak(userId, TZ);

    vi.setSystemTime(new Date("2026-07-04T18:00:00Z"));
    const s = await tickStreak(userId, TZ);
    expect(s.currentStreak).toBe(1);
    expect(s.usedFreeze).toBe(false);
  });

  it("respects the user's timezone for day boundaries", async () => {
    const { userId } = await signup();
    vi.useFakeTimers();
    // 2026-07-02 03:00 UTC = 2026-07-01 23:00 in New York — still July 1 locally.
    vi.setSystemTime(new Date("2026-07-02T03:00:00Z"));
    await tickStreak(userId, TZ);
    const days = await db.select().from(schema.streakDays);
    expect(days[0]?.day).toBe("2026-07-01");
  });
});

describe("sessions + streak + recap flow", () => {
  beforeEach(resetDb);

  it("runs the full loop: breakdown -> session -> steps -> end -> streak -> recap", async () => {
    const { cookie, userId } = await signup();
    await grantPro(userId);
    await setTz(cookie);

    const created = await app.request(
      "/api/ai/breakdown",
      authed(cookie, { method: "POST", body: JSON.stringify({ title: "clean desk" }) }),
    );
    const task = (await created.json()) as any;

    const startRes = await app.request(
      "/api/sessions",
      authed(cookie, { method: "POST", body: JSON.stringify({ taskId: task.id }) }),
    );
    expect(startRes.status).toBe(201);
    const session = (await startRes.json()) as any;

    // Task flips to in_progress
    const taskAfter = (await (
      await app.request(`/api/tasks/${task.id}`, authed(cookie))
    ).json()) as any;
    expect(taskAfter.status).toBe("in_progress");

    // Complete all steps
    for (const step of task.steps) {
      const res = await app.request(
        `/api/steps/${step.id}`,
        authed(cookie, { method: "PATCH", body: JSON.stringify({ status: "done" }) }),
      );
      expect(res.status).toBe(200);
    }

    // Mark task done, end session
    await app.request(
      `/api/tasks/${task.id}`,
      authed(cookie, { method: "PATCH", body: JSON.stringify({ status: "done" }) }),
    );
    const endRes = await app.request(
      `/api/sessions/${session.id}`,
      authed(cookie, {
        method: "PATCH",
        body: JSON.stringify({
          stepsCompleted: task.steps.length,
          durationSeconds: 420,
        }),
      }),
    );
    expect(endRes.status).toBe(200);
    const ended = (await endRes.json()) as any;
    expect(ended.streak.currentStreak).toBe(1);

    // Streak view
    const streak = (await (
      await app.request("/api/streak", authed(cookie))
    ).json()) as any;
    expect(streak.currentStreak).toBe(1);
    expect(streak.days.length).toBe(1);

    // Weekly recap aggregates
    const recap = (await (
      await app.request("/api/recap/weekly", authed(cookie))
    ).json()) as any;
    expect(recap.tasksDone).toBe(1);
    expect(recap.stepsCompleted).toBe(task.steps.length);
    expect(recap.minutesFocused).toBe(7);
    expect(recap.activeDays).toBe(1);
    expect(recap.oneLiner.length).toBeGreaterThan(10);

    // Share card logging
    const card = await app.request(
      "/api/cards",
      authed(cookie, {
        method: "POST",
        body: JSON.stringify({ taskId: task.id, cardType: "task_slayed" }),
      }),
    );
    expect(card.status).toBe(201);
  });

  it("blocks step updates across users", async () => {
    const alice = await signup();
    await grantPro(alice.userId);
    const created = await app.request(
      "/api/ai/breakdown",
      authed(alice.cookie, { method: "POST", body: JSON.stringify({ title: "t" }) }),
    );
    const task = (await created.json()) as any;

    const mallory = await signup();
    const res = await app.request(
      `/api/steps/${task.steps[0].id}`,
      authed(mallory.cookie, { method: "PATCH", body: JSON.stringify({ status: "done" }) }),
    );
    expect(res.status).toBe(404);
  });
});
