import { createMiddleware } from "hono/factory";
import { eq } from "drizzle-orm";
import { db, schema } from "../db";
import type { AuthEnv } from "./auth";

const ACTIVE_STATUSES = new Set(["active", "trialing", "grace"]);

/**
 * Server-side entitlement gate for paid endpoints. The `subscriptions` table
 * (fed by RevenueCat webhooks) is the source of truth — never the client.
 * ENTITLEMENT_BYPASS=1 exists for tests/e2e only.
 */
export const requirePro = createMiddleware<AuthEnv>(async (c, next) => {
  if (process.env.ENTITLEMENT_BYPASS === "1") {
    await next();
    return;
  }
  const user = c.get("user");
  const [sub] = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, user.id))
    .limit(1);

  const active =
    sub &&
    ACTIVE_STATUSES.has(sub.status) &&
    (!sub.expiresAt || sub.expiresAt.getTime() > Date.now());

  if (!active) {
    return c.json({ error: "subscription_required" }, 403);
  }
  await next();
});
