import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { patchMeSchema } from "@dtt/shared/schemas/me";
import { db, schema } from "../db";
import { requireAuth, type AuthEnv } from "../middleware/auth";
import { getStreakView } from "../lib/streaks";

export const meRoutes = new Hono<AuthEnv>();

meRoutes.use("*", requireAuth);

meRoutes.get("/", async (c) => {
  const user = c.get("user");
  const [row] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, user.id))
    .limit(1);
  if (!row) return c.json({ error: "not_found" }, 404);

  const [sub] = await db
    .select({
      status: schema.subscriptions.status,
      expiresAt: schema.subscriptions.expiresAt,
      willRenew: schema.subscriptions.willRenew,
    })
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, user.id))
    .limit(1);

  const streak = await getStreakView(user.id, row.timezone);

  return c.json({
    id: row.id,
    email: row.email,
    coachTone: row.coachTone,
    quizAnswers: row.quizAnswers,
    timezone: row.timezone,
    onboardedAt: row.onboardedAt,
    subscription: sub ?? null,
    streak: {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      freezesAvailable: streak.freezesAvailable,
    },
  });
});

meRoutes.patch("/", zValidator("json", patchMeSchema), async (c) => {
  const user = c.get("user");
  const body = c.req.valid("json");
  await db
    .update(schema.user)
    .set({
      ...(body.coachTone !== undefined ? { coachTone: body.coachTone } : {}),
      ...(body.quizAnswers !== undefined ? { quizAnswers: body.quizAnswers } : {}),
      ...(body.timezone !== undefined ? { timezone: body.timezone } : {}),
      ...(body.onboarded ? { onboardedAt: new Date() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.user.id, user.id));
  return c.json({ ok: true });
});

meRoutes.delete("/", async (c) => {
  const user = c.get("user");
  // FK cascades remove sessions, tasks, steps, streaks, subscriptions, usage.
  await db.delete(schema.user).where(eq(schema.user.id, user.id));
  return c.json({ ok: true });
});
