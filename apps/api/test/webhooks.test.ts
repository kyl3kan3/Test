import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { app, authed, db, resetDb, schema, signup } from "./helpers";
import { rcEvent, subscriberFixtures, subscriberWith } from "./fixtures/revenuecat";

function post(body: unknown, auth = "test-webhook-secret") {
  return app.request("/api/webhooks/revenuecat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify(body),
  });
}

async function subFor(userId: string) {
  const [row] = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, userId))
    .limit(1);
  return row;
}

describe("RevenueCat webhook", () => {
  beforeEach(async () => {
    await resetDb();
    subscriberFixtures.clear();
  });

  it("rejects bad auth header", async () => {
    const res = await post(rcEvent({ id: "e1", type: "INITIAL_PURCHASE", appUserId: "u" }), "wrong");
    expect(res.status).toBe(401);
  });

  it("activates entitlement on INITIAL_PURCHASE", async () => {
    const { userId } = await signup();
    subscriberFixtures.set(userId, subscriberWith({}));
    const res = await post(rcEvent({ id: "e1", type: "INITIAL_PURCHASE", appUserId: userId }));
    expect(res.status).toBe(200);
    const sub = await subFor(userId);
    expect(sub?.status).toBe("active");
    expect(sub?.productId).toBe("pro_yearly");
    expect(sub?.lastEventType).toBe("INITIAL_PURCHASE");
  });

  it("marks trials as trialing", async () => {
    const { userId } = await signup();
    subscriberFixtures.set(userId, subscriberWith({ periodType: "trial" }));
    await post(rcEvent({ id: "e1", type: "INITIAL_PURCHASE", appUserId: userId }));
    expect((await subFor(userId))?.status).toBe("trialing");
  });

  it("is idempotent on duplicate event ids", async () => {
    const { userId } = await signup();
    subscriberFixtures.set(userId, subscriberWith({}));
    await post(rcEvent({ id: "dup", type: "INITIAL_PURCHASE", appUserId: userId }));
    const res2 = await post(rcEvent({ id: "dup", type: "INITIAL_PURCHASE", appUserId: userId }));
    expect(res2.status).toBe(200);
    expect((await res2.json()) as any).toMatchObject({ duplicate: true });
  });

  it("ignores out-of-order older events", async () => {
    const { userId } = await signup();
    const now = Date.now();
    subscriberFixtures.set(userId, subscriberWith({}));
    await post(rcEvent({ id: "new", type: "RENEWAL", appUserId: userId, timestampMs: now }));

    // Older EXPIRATION event arrives late — must not clobber.
    subscriberFixtures.set(userId, subscriberWith({ entitled: false }));
    const res = await post(
      rcEvent({ id: "old", type: "EXPIRATION", appUserId: userId, timestampMs: now - 60000 }),
    );
    expect(((await res.json()) as any) as any).toMatchObject({ stale: true });
    expect((await subFor(userId))?.status).toBe("active");
  });

  it("expires entitlement on EXPIRATION", async () => {
    const { userId } = await signup();
    subscriberFixtures.set(userId, subscriberWith({}));
    await post(rcEvent({ id: "e1", type: "INITIAL_PURCHASE", appUserId: userId, timestampMs: Date.now() - 1000 }));

    subscriberFixtures.set(userId, subscriberWith({ entitled: false }));
    await post(rcEvent({ id: "e2", type: "EXPIRATION", appUserId: userId }));
    expect((await subFor(userId))?.status).toBe("expired");
  });

  it("flags billing issues", async () => {
    const { userId } = await signup();
    subscriberFixtures.set(userId, subscriberWith({ billingIssue: true }));
    await post(rcEvent({ id: "e1", type: "BILLING_ISSUE", appUserId: userId }));
    expect((await subFor(userId))?.status).toBe("billing_issue");
  });

  it("keeps CANCELLATION active until expiry (willRenew=false)", async () => {
    const { userId } = await signup();
    subscriberFixtures.set(userId, subscriberWith({ unsubscribed: true }));
    await post(rcEvent({ id: "e1", type: "CANCELLATION", appUserId: userId }));
    const sub = await subFor(userId);
    expect(sub?.status).toBe("active");
    expect(sub?.willRenew).toBe(false);
  });

  it("resolves users via aliases (anonymous purchase then logIn)", async () => {
    const { userId } = await signup();
    const anon = "$RCAnonymousID:abc123";
    subscriberFixtures.set(anon, subscriberWith({}));
    const res = await post(
      rcEvent({ id: "e1", type: "TRANSFER", appUserId: anon, aliases: [anon, userId] }),
    );
    expect(res.status).toBe(200);
    expect((await subFor(userId))?.status).toBe("active");
  });

  it("accepts but does not attach purely anonymous events", async () => {
    const anon = "$RCAnonymousID:noone";
    subscriberFixtures.set(anon, subscriberWith({}));
    const res = await post(rcEvent({ id: "e1", type: "INITIAL_PURCHASE", appUserId: anon, aliases: [anon] }));
    expect(res.status).toBe(200);
    expect(((await res.json()) as any) as any).toMatchObject({ unmatched: true });
  });

  it("returns 502 and re-processes when the subscriber fetch fails", async () => {
    const { userId } = await signup();
    // No fixture registered -> RC API 404 -> fetch throws.
    const res = await post(rcEvent({ id: "retry-me", type: "INITIAL_PURCHASE", appUserId: userId }));
    expect(res.status).toBe(502);

    // RC retries with the same event id; now the fetch works.
    subscriberFixtures.set(userId, subscriberWith({}));
    const res2 = await post(rcEvent({ id: "retry-me", type: "INITIAL_PURCHASE", appUserId: userId }));
    expect(res2.status).toBe(200);
    expect((await res2.json()) as any).not.toMatchObject({ duplicate: true });
    expect((await subFor(userId))?.status).toBe("active");
  });

  it("unlocks AI endpoints after activation (end-to-end gate)", async () => {
    const { cookie, userId } = await signup();
    const before = await app.request(
      "/api/ai/breakdown",
      authed(cookie, { method: "POST", body: JSON.stringify({ title: "x" }) }),
    );
    expect(before.status).toBe(403);

    subscriberFixtures.set(userId, subscriberWith({}));
    await post(rcEvent({ id: "e1", type: "INITIAL_PURCHASE", appUserId: userId }));

    const after = await app.request(
      "/api/ai/breakdown",
      authed(cookie, { method: "POST", body: JSON.stringify({ title: "x" }) }),
    );
    expect(after.status).toBe(201);
  });
});
