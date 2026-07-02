import { beforeEach, describe, expect, it } from "vitest";
import { app, authed, db, grantPro, resetDb, schema, signup } from "./helpers";
import { AI_DAILY_LIMITS } from "@dtt/shared/limits";
import { eq } from "drizzle-orm";

// 1x1 transparent PNG
const TINY_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

describe("AI endpoints (mock model)", () => {
  beforeEach(resetDb);

  it("gates AI behind entitlement", async () => {
    const { cookie } = await signup();
    const res = await app.request(
      "/api/ai/breakdown",
      authed(cookie, { method: "POST", body: JSON.stringify({ title: "clean desk" }) }),
    );
    expect(res.status).toBe(403);
    const body = ((await res.json()) as any) as any;
    expect(body.error).toBe("subscription_required");
  });

  it("breaks a task into persisted micro-steps", async () => {
    const { cookie, userId } = await signup();
    await grantPro(userId);

    const res = await app.request(
      "/api/ai/breakdown",
      authed(cookie, {
        method: "POST",
        body: JSON.stringify({ title: "clean my desk", energyLevel: 2 }),
      }),
    );
    expect(res.status).toBe(201);
    const task = ((await res.json()) as any) as any;
    expect(task.title).toBe("Reset the desk");
    expect(task.vibeCheck).toContain("Starting");
    expect(task.steps.length).toBeGreaterThanOrEqual(3);
    expect(task.steps[0].title).toBe("Stand up");
    expect(task.steps[0].orderIndex).toBe(0);

    // usage logged
    const usage = await db
      .select()
      .from(schema.aiUsage)
      .where(eq(schema.aiUsage.userId, userId));
    expect(usage.length).toBe(1);
    expect(usage[0]!.endpoint).toBe("breakdown");
    expect(usage[0]!.outputTokens).toBe(50);
  });

  it("builds a plan from a photo with neutral observations", async () => {
    const { cookie, userId } = await signup();
    await grantPro(userId);

    const res = await app.request(
      "/api/ai/photo-plan",
      authed(cookie, {
        method: "POST",
        body: JSON.stringify({ imageBase64: TINY_PNG, mimeType: "image/png" }),
      }),
    );
    expect(res.status).toBe(201);
    const task = ((await res.json()) as any) as any;
    expect(task.source).toBe("photo");
    expect(task.observations).toEqual([
      "papers on the desk",
      "two mugs by the monitor",
    ]);
  });

  it("rejects oversized photos with 413", async () => {
    const { cookie, userId } = await signup();
    await grantPro(userId);
    const huge = "A".repeat(3 * 1024 * 1024 + 1);
    const res = await app.request(
      "/api/ai/photo-plan",
      authed(cookie, {
        method: "POST",
        body: JSON.stringify({ imageBase64: huge, mimeType: "image/jpeg" }),
      }),
    );
    expect(res.status).toBe(413);
  });

  it("enforces the daily rate limit", async () => {
    const { cookie, userId } = await signup();
    await grantPro(userId);

    // Pre-fill today's usage to the cap, then expect 429.
    await db.insert(schema.aiUsage).values(
      Array.from({ length: AI_DAILY_LIMITS.breakdown }, () => ({
        userId,
        endpoint: "breakdown",
        model: "mock",
        inputTokens: 1,
        outputTokens: 1,
      })),
    );

    const res = await app.request(
      "/api/ai/breakdown",
      authed(cookie, { method: "POST", body: JSON.stringify({ title: "x" }) }),
    );
    expect(res.status).toBe(429);
    const body = ((await res.json()) as any) as any;
    expect(body.limit).toBe(AI_DAILY_LIMITS.breakdown);
  });

  it("streams coach chat as a UI message stream", async () => {
    const { cookie, userId } = await signup();
    await grantPro(userId);

    // Create a task to coach on.
    const created = await app.request(
      "/api/ai/breakdown",
      authed(cookie, { method: "POST", body: JSON.stringify({ title: "dishes" }) }),
    );
    const task = (await created.json()) as any;

    const res = await app.request(
      "/api/ai/chat",
      authed(cookie, {
        method: "POST",
        body: JSON.stringify({
          messages: [
            {
              id: "m1",
              role: "user",
              parts: [{ type: "text", text: "[event:session_started]" }],
            },
          ],
          sessionContext: {
            taskId: task.id,
            taskTitle: task.title,
            stepTitle: task.steps[0].title,
            stepIndex: 0,
            stepCount: task.steps.length,
            secondsElapsed: 0,
          },
        }),
      }),
    );
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("You've got this.");
  });

  it("404s chat on a task the user does not own", async () => {
    const alice = await signup();
    await grantPro(alice.userId);
    const created = await app.request(
      "/api/ai/breakdown",
      authed(alice.cookie, { method: "POST", body: JSON.stringify({ title: "t" }) }),
    );
    const task = (await created.json()) as any;

    const mallory = await signup();
    await grantPro(mallory.userId);
    const res = await app.request(
      "/api/ai/chat",
      authed(mallory.cookie, {
        method: "POST",
        body: JSON.stringify({
          messages: [
            { id: "m1", role: "user", parts: [{ type: "text", text: "hi" }] },
          ],
          sessionContext: {
            taskId: task.id,
            taskTitle: "t",
            stepTitle: "s",
            stepIndex: 0,
            stepCount: 1,
            secondsElapsed: 0,
          },
        }),
      }),
    );
    expect(res.status).toBe(404);
  });
});
