import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import {
  listTasksQuerySchema,
  patchStepSchema,
  patchTaskSchema,
} from "@dtt/shared/schemas/tasks";
import { db, schema } from "../db";
import { requireAuth, type AuthEnv } from "../middleware/auth";

export const taskRoutes = new Hono<AuthEnv>();

taskRoutes.use("*", requireAuth);

taskRoutes.get("/", zValidator("query", listTasksQuerySchema), async (c) => {
  const user = c.get("user");
  const { status } = c.req.valid("query");

  const where = status
    ? and(eq(schema.tasks.userId, user.id), eq(schema.tasks.status, status))
    : eq(schema.tasks.userId, user.id);

  const rows = await db
    .select()
    .from(schema.tasks)
    .where(where)
    .orderBy(desc(schema.tasks.createdAt))
    .limit(50);

  const ids = rows.map((r) => r.id);
  const steps = ids.length
    ? await db
        .select()
        .from(schema.microSteps)
        .where(inArray(schema.microSteps.taskId, ids))
        .orderBy(asc(schema.microSteps.orderIndex))
    : [];

  const byTask = new Map<string, typeof steps>();
  for (const s of steps) {
    const list = byTask.get(s.taskId) ?? [];
    list.push(s);
    byTask.set(s.taskId, list);
  }

  return c.json(rows.map((t) => ({ ...t, steps: byTask.get(t.id) ?? [] })));
});

taskRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const [task] = await db
    .select()
    .from(schema.tasks)
    .where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, user.id)))
    .limit(1);
  if (!task) return c.json({ error: "not_found" }, 404);
  const steps = await db
    .select()
    .from(schema.microSteps)
    .where(eq(schema.microSteps.taskId, id))
    .orderBy(asc(schema.microSteps.orderIndex));
  return c.json({ ...task, steps });
});

taskRoutes.patch("/:id", zValidator("json", patchTaskSchema), async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const { status } = c.req.valid("json");
  const [updated] = await db
    .update(schema.tasks)
    .set({
      status,
      ...(status === "done" ? { completedAt: new Date() } : {}),
    })
    .where(and(eq(schema.tasks.id, id), eq(schema.tasks.userId, user.id)))
    .returning();
  if (!updated) return c.json({ error: "not_found" }, 404);
  return c.json(updated);
});

export const stepRoutes = new Hono<AuthEnv>();

stepRoutes.use("*", requireAuth);

stepRoutes.patch("/:id", zValidator("json", patchStepSchema), async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const { status } = c.req.valid("json");

  // Ownership check via task join before writing.
  const [step] = await db
    .select({ id: schema.microSteps.id })
    .from(schema.microSteps)
    .innerJoin(schema.tasks, eq(schema.microSteps.taskId, schema.tasks.id))
    .where(and(eq(schema.microSteps.id, id), eq(schema.tasks.userId, user.id)))
    .limit(1);
  if (!step) return c.json({ error: "not_found" }, 404);

  const [updated] = await db
    .update(schema.microSteps)
    .set({
      status,
      ...(status === "done" ? { completedAt: new Date() } : {}),
    })
    .where(eq(schema.microSteps.id, id))
    .returning();
  return c.json(updated);
});
