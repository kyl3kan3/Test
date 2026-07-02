import { Hono } from "hono";
import { and, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "../db";
import { requireAuth, type AuthEnv } from "../middleware/auth";
import { localDay } from "../lib/streaks";

export const recapRoutes = new Hono<AuthEnv>();

recapRoutes.use("*", requireAuth);

/** Deterministic, archetype-flavored one-liners — no AI call, free, testable. */
const ONE_LINERS = [
  "Your brain showed up %TASKS% times this week. That's not luck, that's you.",
  "%MINUTES% minutes of focused doing. The dread never stood a chance.",
  "Started %TASKS% things you were dreading. Certified thing-doer.",
  "The to-do list is scared of you now. %TASKS% tasks down.",
];

/** Monday (00:00) of the current week in the user's local timezone, as YYYY-MM-DD. */
function weekStart(tz: string | null): string {
  const today = localDay(tz);
  const d = new Date(`${today}T12:00:00Z`);
  const dow = d.getUTCDay(); // 0=Sun
  const delta = dow === 0 ? 6 : dow - 1;
  d.setUTCDate(d.getUTCDate() - delta);
  return d.toISOString().slice(0, 10);
}

recapRoutes.get("/weekly", async (c) => {
  const user = c.get("user");
  const start = weekStart(user.timezone);
  const startTs = new Date(`${start}T00:00:00Z`);

  const [taskAgg] = await db
    .select({
      done: sql<number>`count(*) filter (where ${schema.tasks.status} = 'done')::int`,
      started: sql<number>`count(*)::int`,
    })
    .from(schema.tasks)
    .where(and(eq(schema.tasks.userId, user.id), gte(schema.tasks.createdAt, startTs)));

  const [sessionAgg] = await db
    .select({
      sessions: sql<number>`count(*)::int`,
      minutes: sql<number>`coalesce(sum(${schema.focusSessions.durationSeconds}), 0)::int / 60`,
      steps: sql<number>`coalesce(sum(${schema.focusSessions.stepsCompleted}), 0)::int`,
    })
    .from(schema.focusSessions)
    .where(
      and(
        eq(schema.focusSessions.userId, user.id),
        gte(schema.focusSessions.startedAt, startTs),
      ),
    );

  const activeDays = await db
    .select({ day: schema.streakDays.day })
    .from(schema.streakDays)
    .where(and(eq(schema.streakDays.userId, user.id), gte(schema.streakDays.day, start)));

  const tasksDone = taskAgg?.done ?? 0;
  const minutes = sessionAgg?.minutes ?? 0;
  const idx = (tasksDone + minutes) % ONE_LINERS.length;
  const oneLiner = (ONE_LINERS[idx] ?? ONE_LINERS[0]!)
    .replace("%TASKS%", String(Math.max(tasksDone, taskAgg?.started ?? 0)))
    .replace("%MINUTES%", String(minutes));

  return c.json({
    weekStart: start,
    tasksStarted: taskAgg?.started ?? 0,
    tasksDone,
    stepsCompleted: sessionAgg?.steps ?? 0,
    minutesFocused: minutes,
    sessions: sessionAgg?.sessions ?? 0,
    activeDays: activeDays.length,
    oneLiner,
  });
});
