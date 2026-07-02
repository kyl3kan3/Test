import { createMiddleware } from "hono/factory";
import { and, eq, gte, sql } from "drizzle-orm";
import { AI_DAILY_LIMITS, type AiEndpoint } from "@dtt/shared/limits";
import { db, schema } from "../db";
import type { AuthEnv } from "./auth";

/** Daily (UTC) per-user cap on AI calls, counted from the ai_usage log. */
export function rateLimit(endpoint: AiEndpoint) {
  return createMiddleware<AuthEnv>(async (c, next) => {
    const user = c.get("user");
    const limit = AI_DAILY_LIMITS[endpoint];
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);

    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.aiUsage)
      .where(
        and(
          eq(schema.aiUsage.userId, user.id),
          eq(schema.aiUsage.endpoint, endpoint),
          gte(schema.aiUsage.createdAt, dayStart),
        ),
      );

    if ((row?.count ?? 0) >= limit) {
      return c.json(
        { error: "rate_limited", limit, resetsAt: nextUtcMidnight().toISOString() },
        429,
      );
    }
    await next();
  });
}

function nextUtcMidnight(): Date {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d;
}
