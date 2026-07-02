import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Better Auth core tables (names/columns match the drizzle adapter defaults),
// with app-profile extensions on `user` registered as additionalFields.
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  // app profile extensions
  coachTone: text("coach_tone"), // gentle_cheerleader | chaotic_bestie | calm_steady
  quizAnswers: jsonb("quiz_answers"),
  timezone: text("timezone"),
  onboardedAt: timestamp("onboarded_at"),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// ---------------------------------------------------------------------------
// App tables
// ---------------------------------------------------------------------------

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    source: text("source").notNull(), // 'text' | 'photo'
    vibeCheck: text("vibe_check"),
    observations: jsonb("observations"), // photo path: neutral inventory strings
    status: text("status").notNull().default("ready"), // ready | in_progress | done | abandoned
    createdAt: timestamp("created_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (t) => [index("tasks_user_created_idx").on(t.userId, t.createdAt)],
);

export const microSteps = pgTable(
  "micro_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").notNull(),
    title: text("title").notNull(),
    detail: text("detail"),
    estimatedSeconds: integer("estimated_seconds").notNull(),
    status: text("status").notNull().default("todo"), // todo | done | skipped
    completedAt: timestamp("completed_at"),
  },
  (t) => [index("micro_steps_task_idx").on(t.taskId, t.orderIndex)],
);

export const focusSessions = pgTable(
  "focus_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    endedAt: timestamp("ended_at"),
    stepsCompleted: integer("steps_completed").notNull().default(0),
    durationSeconds: integer("duration_seconds"),
  },
  (t) => [index("sessions_user_started_idx").on(t.userId, t.startedAt)],
);

export const streaks = pgTable("streaks", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActiveDate: date("last_active_date"),
  freezesAvailable: integer("freezes_available").notNull().default(1),
  activeDaysSinceFreezeGrant: integer("active_days_since_freeze_grant")
    .notNull()
    .default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const streakDays = pgTable(
  "streak_days",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    kind: text("kind").notNull(), // active | freeze
  },
  (t) => [uniqueIndex("streak_days_user_day_uq").on(t.userId, t.day)],
);

export const shareCards = pgTable(
  "share_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    cardType: text("card_type").notNull(), // task_slayed | before_after | streak | wrapped
    shared: boolean("shared").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("share_cards_user_idx").on(t.userId, t.createdAt)],
);

// RevenueCat webhook sink — server-side source of truth for entitlement gating.
export const subscriptions = pgTable("subscriptions", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  rcAppUserId: text("rc_app_user_id").notNull(),
  entitlement: text("entitlement").notNull().default("pro"),
  status: text("status").notNull(), // active | trialing | grace | expired | billing_issue
  productId: text("product_id"),
  store: text("store"), // app_store | play_store
  environment: text("environment"), // SANDBOX | PRODUCTION
  expiresAt: timestamp("expires_at"),
  willRenew: boolean("will_renew"),
  lastEventType: text("last_event_type"),
  lastEventAt: timestamp("last_event_at"),
  raw: jsonb("raw"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// At-least-once webhook delivery → idempotency ledger keyed on RC event id.
export const revenuecatEvents = pgTable("revenuecat_events", {
  eventId: text("event_id").primaryKey(),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
});

export const aiUsage = pgTable(
  "ai_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(), // breakdown | photo_plan | chat
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("ai_usage_user_endpoint_created_idx").on(
      t.userId,
      t.endpoint,
      t.createdAt,
    ),
  ],
);
