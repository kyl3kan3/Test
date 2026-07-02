import { Hono } from "hono";
import { getLastOtpForTests } from "../lib/email";

/**
 * Test-only helpers, mounted ONLY when E2E=1. Never enabled in production.
 */
export const testOnlyRoutes = new Hono();

testOnlyRoutes.post("/last-otp", async (c) => {
  const last = getLastOtpForTests();
  if (!last) return c.json({ error: "no_otp" }, 404);
  return c.json(last);
});
