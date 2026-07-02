import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import {
  createCardSchema,
  endSessionSchema,
  startSessionSchema,
} from "@dtt/shared/schemas/sessions";
import { db, schema } from "../db";
import { requireAuth, type AuthEnv } from "../middleware/auth";
import { tickStreak } from "../lib/streaks";

export const sessionRoutes = new Hono<AuthEnv>();

sessionRoutes.use("*", requireAuth);

sessionRoutes.post("/", zValidator("json", startSessionSchema), async (c) => {
  const user = c.get("user");
  const { taskId } = c.req.valid("json");

  const [task] = await db
    .select({ id: schema.tasks.id })
    .from(schema.tasks)
    .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.userId, user.id)))
    .limit(1);
  if (!task) return c.json({ error: "not_found" }, 404);

  await db
    .update(schema.tasks)
    .set({ status: "in_progress" })
    .where(eq(schema.tasks.id, taskId));

  const [session] = await db
    .insert(schema.focusSessions)
    .values({ userId: user.id, taskId })
    .returning();
  return c.json(session, 201);
});

sessionRoutes.patch("/:id", zValidator("json", endSessionSchema), async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = c.req.valid("json");

  const [updated] = await db
    .update(schema.focusSessions)
    .set({
      endedAt: new Date(),
      stepsCompleted: body.stepsCompleted,
      durationSeconds: body.durationSeconds,
    })
    .where(
      and(eq(schema.focusSessions.id, id), eq(schema.focusSessions.userId, user.id)),
    )
    .returning();
  if (!updated) return c.json({ error: "not_found" }, 404);

  // Any completed session with at least one step counts as an active day.
  let streak = null;
  if (body.stepsCompleted > 0) {
    streak = await tickStreak(user.id, user.timezone);
  }
  return c.json({ session: updated, streak });
});

export const cardRoutes = new Hono<AuthEnv>();

cardRoutes.use("*", requireAuth);

cardRoutes.post("/", zValidator("json", createCardSchema), async (c) => {
  const user = c.get("user");
  const body = c.req.valid("json");
  const [card] = await db
    .insert(schema.shareCards)
    .values({
      userId: user.id,
      taskId: body.taskId ?? null,
      cardType: body.cardType,
    })
    .returning();
  return c.json(card, 201);
});

cardRoutes.patch("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const [updated] = await db
    .update(schema.shareCards)
    .set({ shared: true })
    .where(and(eq(schema.shareCards.id, id), eq(schema.shareCards.userId, user.id)))
    .returning();
  if (!updated) return c.json({ error: "not_found" }, 404);
  return c.json(updated);
});
