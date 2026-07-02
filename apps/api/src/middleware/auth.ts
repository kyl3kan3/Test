import { createMiddleware } from "hono/factory";
import { auth } from "../lib/auth";

export type AuthedUser = {
  id: string;
  email: string;
  coachTone: string | null;
  timezone: string | null;
};

export type AuthEnv = {
  Variables: {
    user: AuthedUser;
  };
};

export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: "unauthorized" }, 401);
  }
  const u = session.user as unknown as AuthedUser & Record<string, unknown>;
  c.set("user", {
    id: u.id,
    email: u.email,
    coachTone: (u.coachTone as string | null) ?? null,
    timezone: (u.timezone as string | null) ?? null,
  });
  await next();
});
