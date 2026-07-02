import { and, eq, gte } from "drizzle-orm";
import { db, schema } from "../db";

const FREEZE_GRANT_EVERY_ACTIVE_DAYS = 7;
const MAX_FREEZE_BANK = 2;

/** Format a Date as YYYY-MM-DD in the given IANA timezone. */
export function localDay(tz: string | null, at: Date = new Date()): string {
  const timeZone = tz && isValidTz(tz) ? tz : "UTC";
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(at); // en-CA gives YYYY-MM-DD
}

function isValidTz(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function shiftDay(day: string, deltaDays: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Record activity for the user's local "today" and recompute the streak.
 * Freeze economy: earn 1 freeze per 7 active days (bank max 2); a single
 * missed day is auto-covered by a banked freeze, otherwise the streak resets.
 * Idempotent for repeat calls on the same local day.
 */
export async function tickStreak(userId: string, tz: string | null): Promise<{
  currentStreak: number;
  longestStreak: number;
  freezesAvailable: number;
  usedFreeze: boolean;
}> {
  const today = localDay(tz);

  const inserted = await db
    .insert(schema.streakDays)
    .values({ userId, day: today, kind: "active" })
    .onConflictDoNothing()
    .returning({ id: schema.streakDays.id });

  const [existing] = await db
    .select()
    .from(schema.streaks)
    .where(eq(schema.streaks.userId, userId))
    .limit(1);

  if (!existing) {
    const fresh = {
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: today,
      freezesAvailable: 1,
      activeDaysSinceFreezeGrant: 1,
    };
    await db.insert(schema.streaks).values(fresh).onConflictDoNothing();
    return { ...fresh, usedFreeze: false };
  }

  // Same local day tick (already counted) — return current state unchanged.
  if (inserted.length === 0 || existing.lastActiveDate === today) {
    return {
      currentStreak: existing.currentStreak,
      longestStreak: existing.longestStreak,
      freezesAvailable: existing.freezesAvailable,
      usedFreeze: false,
    };
  }

  const yesterday = shiftDay(today, -1);
  let current = existing.currentStreak;
  let freezes = existing.freezesAvailable;
  let usedFreeze = false;

  if (existing.lastActiveDate === yesterday) {
    current += 1;
  } else if (
    existing.lastActiveDate === shiftDay(today, -2) &&
    freezes > 0
  ) {
    // Exactly one missed day and a freeze in the bank: auto-cover it.
    freezes -= 1;
    usedFreeze = true;
    await db
      .insert(schema.streakDays)
      .values({ userId, day: yesterday, kind: "freeze" })
      .onConflictDoNothing();
    current += 1;
  } else {
    current = 1;
  }

  let activeSinceGrant = existing.activeDaysSinceFreezeGrant + 1;
  if (activeSinceGrant >= FREEZE_GRANT_EVERY_ACTIVE_DAYS) {
    activeSinceGrant = 0;
    freezes = Math.min(MAX_FREEZE_BANK, freezes + 1);
  }

  const longest = Math.max(existing.longestStreak, current);
  await db
    .update(schema.streaks)
    .set({
      currentStreak: current,
      longestStreak: longest,
      lastActiveDate: today,
      freezesAvailable: freezes,
      activeDaysSinceFreezeGrant: activeSinceGrant,
      updatedAt: new Date(),
    })
    .where(eq(schema.streaks.userId, userId));

  return {
    currentStreak: current,
    longestStreak: longest,
    freezesAvailable: freezes,
    usedFreeze,
  };
}

/** Streak row + last ~5 weeks of day marks for the calendar grid. */
export async function getStreakView(userId: string, tz: string | null) {
  const [row] = await db
    .select()
    .from(schema.streaks)
    .where(eq(schema.streaks.userId, userId))
    .limit(1);

  const since = shiftDay(localDay(tz), -34);
  const days = await db
    .select({ day: schema.streakDays.day, kind: schema.streakDays.kind })
    .from(schema.streakDays)
    .where(and(eq(schema.streakDays.userId, userId), gte(schema.streakDays.day, since)));

  return {
    currentStreak: row?.currentStreak ?? 0,
    longestStreak: row?.longestStreak ?? 0,
    freezesAvailable: row?.freezesAvailable ?? 1,
    lastActiveDate: row?.lastActiveDate ?? null,
    days,
  };
}
