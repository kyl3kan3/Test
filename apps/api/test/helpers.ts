import { sql } from "drizzle-orm";
import { app } from "../src/app";
import { db, schema } from "../src/db";
import { getLastOtpForTests } from "../src/lib/email";

export { app, db, schema };

/** Wipe all app data between tests. User cascade removes nearly everything. */
export async function resetDb(): Promise<void> {
  await db.execute(sql`delete from "user"`);
  await db.execute(sql`delete from "verification"`);
  await db.execute(sql`delete from "revenuecat_events"`);
}

let emailCounter = 0;

/** Full email-OTP signup; returns the session cookie + user id. */
export async function signup(email?: string): Promise<{
  email: string;
  cookie: string;
  userId: string;
}> {
  const addr = email ?? `user${++emailCounter}-${Date.now()}@test.dev`;

  const sendRes = await app.request("/api/auth/email-otp/send-verification-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: addr, type: "sign-in" }),
  });
  if (!sendRes.ok) {
    throw new Error(`send otp failed: ${sendRes.status} ${await sendRes.text()}`);
  }

  const otp = getLastOtpForTests();
  if (!otp || otp.email !== addr) throw new Error("no OTP captured");

  const signinRes = await app.request("/api/auth/sign-in/email-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: addr, otp: otp.otp }),
  });
  if (!signinRes.ok) {
    throw new Error(`sign-in failed: ${signinRes.status} ${await signinRes.text()}`);
  }

  const setCookie = signinRes.headers.get("set-cookie");
  if (!setCookie) throw new Error("no session cookie returned");
  const cookie = setCookie.split(";")[0]!;

  const body = (await signinRes.json()) as { user?: { id?: string } };
  const userId = body.user?.id;
  if (!userId) throw new Error("no user id in sign-in response");

  return { email: addr, cookie, userId };
}

/** Directly grant an active pro subscription (bypasses webhook path). */
export async function grantPro(userId: string): Promise<void> {
  await db.insert(schema.subscriptions).values({
    userId,
    rcAppUserId: userId,
    entitlement: "pro",
    status: "active",
    productId: "pro_yearly",
    store: "app_store",
    environment: "SANDBOX",
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    willRenew: true,
    lastEventType: "TEST_GRANT",
    lastEventAt: new Date(),
  });
}

export function authed(cookie: string, init?: RequestInit): RequestInit {
  return {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      ...(init?.headers ?? {}),
    },
  };
}
