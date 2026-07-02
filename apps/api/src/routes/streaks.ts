import { Hono } from "hono";
import { requireAuth, type AuthEnv } from "../middleware/auth";
import { getStreakView } from "../lib/streaks";

export const streakRoutes = new Hono<AuthEnv>();

streakRoutes.use("*", requireAuth);

streakRoutes.get("/", async (c) => {
  const user = c.get("user");
  return c.json(await getStreakView(user.id, user.timezone));
});
