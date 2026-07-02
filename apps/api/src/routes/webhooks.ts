import { Hono } from "hono";
import { timingSafeEqual } from "node:crypto";
import { eq, or } from "drizzle-orm";
import { db, schema } from "../db";
import { deriveSubscription, fetchSubscriber } from "../lib/revenuecat";

export const webhookRoutes = new Hono();

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * RevenueCat webhook. Deliveries are at-least-once and can arrive out of
 * order, so the handler is idempotent (event_id ledger) and state is derived
 * from a fresh subscriber fetch, never from the event body.
 */
webhookRoutes.post("/revenuecat", async (c) => {
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH;
  if (!expected) {
    console.error("REVENUECAT_WEBHOOK_AUTH not configured");
    return c.json({ error: "not_configured" }, 500);
  }
  const header = c.req.header("Authorization") ?? "";
  if (!safeEqual(header, expected)) {
    return c.json({ error: "unauthorized" }, 401);
  }

  let payload: any;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ error: "bad_json" }, 400);
  }
  const event = payload?.event;
  if (!event?.id || !event?.type) {
    return c.json({ error: "bad_event" }, 400);
  }

  // Idempotency gate: first insert wins; duplicates return 200 so RC stops retrying.
  const inserted = await db
    .insert(schema.revenuecatEvents)
    .values({ eventId: String(event.id) })
    .onConflictDoNothing()
    .returning({ eventId: schema.revenuecatEvents.eventId });
  if (inserted.length === 0) {
    return c.json({ ok: true, duplicate: true });
  }

  // Resolve which of our users this event belongs to: app_user_id first,
  // then any alias that matches a user row (logIn() aliases anon -> user id).
  const candidateIds: string[] = [
    event.app_user_id,
    ...(Array.isArray(event.aliases) ? event.aliases : []),
  ].filter((id: unknown): id is string => typeof id === "string" && id.length > 0);

  const nonAnonymous = candidateIds.filter((id) => !id.startsWith("$RCAnonymousID:"));
  let userId: string | null = null;
  if (nonAnonymous.length > 0) {
    const matches = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(or(...nonAnonymous.map((id) => eq(schema.user.id, id))));
    userId = matches[0]?.id ?? null;
  }

  if (!userId) {
    // Purchase under a purely anonymous id: nothing to attach to yet. The
    // next event after Purchases.logIn() carries the alias and lands.
    console.warn(
      `revenuecat: no user match for event ${event.id} (${event.type}); ids=${candidateIds.join(",")}`,
    );
    return c.json({ ok: true, unmatched: true });
  }

  const eventAt = new Date(Number(event.event_timestamp_ms ?? Date.now()));

  // Out-of-order guard: ignore events older than what we've already applied.
  const [existing] = await db
    .select({ lastEventAt: schema.subscriptions.lastEventAt })
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, userId))
    .limit(1);
  if (existing?.lastEventAt && existing.lastEventAt.getTime() > eventAt.getTime()) {
    return c.json({ ok: true, stale: true });
  }

  // Fresh state from RC — the event body is only a hint.
  let derived;
  try {
    const subscriber = await fetchSubscriber(event.app_user_id);
    derived = deriveSubscription(subscriber, "pro");
  } catch (err) {
    console.error("revenuecat subscriber fetch failed", err);
    // Roll back the ledger entry so RC's retry can re-process this event.
    await db
      .delete(schema.revenuecatEvents)
      .where(eq(schema.revenuecatEvents.eventId, String(event.id)));
    return c.json({ error: "subscriber_fetch_failed" }, 502);
  }

  await db
    .insert(schema.subscriptions)
    .values({
      userId,
      rcAppUserId: String(event.app_user_id),
      entitlement: "pro",
      status: derived.status,
      productId: derived.productId,
      store: derived.store,
      environment: event.environment ?? null,
      expiresAt: derived.expiresAt,
      willRenew: derived.willRenew,
      lastEventType: String(event.type),
      lastEventAt: eventAt,
      raw: event,
    })
    .onConflictDoUpdate({
      target: schema.subscriptions.userId,
      set: {
        rcAppUserId: String(event.app_user_id),
        status: derived.status,
        productId: derived.productId,
        store: derived.store,
        environment: event.environment ?? null,
        expiresAt: derived.expiresAt,
        willRenew: derived.willRenew,
        lastEventType: String(event.type),
        lastEventAt: eventAt,
        raw: event,
        updatedAt: new Date(),
      },
    });

  return c.json({ ok: true });
});
