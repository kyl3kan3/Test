import type { Me, MicroStep, StreakView, Task, WeeklyRecap } from "./api";
import type { SessionContext } from "@dtt/shared/schemas/ai";

/**
 * Demo mode: the entire backend, in-memory, in the browser. Built for the
 * public web demo (EXPO_PUBLIC_DEMO=1) — no accounts, no network, no keys.
 * A page refresh resets the world back to the onboarding hook.
 */

class DemoApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`Demo API ${status}`);
  }
}

let uid = 0;
const nextId = (prefix: string) => `${prefix}_${++uid}`;

function dayKey(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
}

const state = {
  me: null as Me | null,
  coachTone: "gentle_cheerleader",
  tasks: new Map<string, Task>(),
  sessions: new Map<string, string>(), // sessionId -> taskId
  activeDays: new Set<string>(),
  minutesFocused: 0,
  sessionCount: 0,
};

function streakView(): StreakView {
  const days = [...state.activeDays].sort();
  // Current streak: consecutive days ending today or yesterday.
  let current = 0;
  for (let i = 0; ; i++) {
    if (state.activeDays.has(dayKey(i))) current++;
    else if (i === 0) continue; // today not active yet doesn't break it
    else break;
  }
  // Longest run anywhere in history.
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of days) {
    if (prev) {
      const gap =
        (new Date(`${day}T12:00Z`).getTime() - new Date(`${prev}T12:00Z`).getTime()) / 86_400_000;
      run = gap === 1 ? run + 1 : 1;
    } else run = 1;
    longest = Math.max(longest, run);
    prev = day;
  }
  return {
    currentStreak: current,
    longestStreak: Math.max(longest, current),
    freezesAvailable: 0,
    lastActiveDate: days[days.length - 1] ?? null,
    days: days.map((day) => ({ day, kind: "active" as const })),
  };
}

function withStreak(me: Me): Me {
  const s = streakView();
  return {
    ...me,
    streak: {
      currentStreak: s.currentStreak,
      longestStreak: s.longestStreak,
      freezesAvailable: s.freezesAvailable,
    },
  };
}

function markTodayActive() {
  state.activeDays.add(dayKey(0));
}

// ---------- breakdown content ----------

const VIBECHECKS = [
  "Starting is the hard part for an ADHD brain — the task itself is smaller than it feels.",
  "You don't need motivation to start. You need a first step small enough to do without it.",
  "This has been renting space in your head all day. It's a 6-minute task wearing a scary costume.",
];
let vibeIdx = 0;

type StepSeed = [title: string, detail: string, seconds: number];

const TEMPLATES: { match: RegExp; steps: StepSeed[] }[] = [
  {
    match: /laundry|wash|clothes/i,
    steps: [
      ["Carry the basket to the machine", "Don't sort. Just move it.", 60],
      ["Load the machine", "Perfection not required — it's laundry, not Tetris.", 90],
      ["Start the cycle", "Detergent, button, done.", 30],
      ["Fold five things only", "Five. Then you're allowed to stop.", 120],
    ],
  },
  {
    match: /email|inbox|portal|reply|message|chat/i,
    steps: [
      ["Open just the one message", "Not the whole inbox. One.", 45],
      ["Read it once, no replying yet", "Reading is its own step. It counts.", 60],
      ["Type a two-sentence reply", "Short is kind. Short is done.", 120],
      ["Hit send and close the tab", "Done beats perfect. Send it.", 30],
    ],
  },
  {
    match: /permission|form|school|sign|paper/i,
    steps: [
      ["Find the form and a pen", "That's the whole step. Locate it.", 60],
      ["Fill in the name and date", "Just the top section.", 60],
      ["Sign it", "One squiggle. You've done harder things today.", 30],
      ["Put it IN the backpack now", "Not next to it. In it. Zip.", 45],
    ],
  },
  {
    match: /dish|kitchen|counter|sink|mug/i,
    steps: [
      ["Clear one mug", "Take the nearest mug or cup to the sink.", 60],
      ["Stack loose papers", "One pile. Don't sort them, stacking is enough.", 60],
      ["Load the top rack only", "Half a dishwasher is a win.", 120],
      ["Wipe one stretch of counter", "One pass with anything — a sleeve counts in emergencies.", 90],
    ],
  },
  {
    match: /meal|dinner|lunch|grocer|food/i,
    steps: [
      ["Pick one dinner — first idea wins", "No scrolling recipes. First idea.", 60],
      ["Check you have the main ingredient", "Open the fridge. Look. Close it.", 60],
      ["Write the three missing items", "Three, max. This isn't a big shop.", 90],
      ["Put the list where you'll see it", "Phone notes or taped to the door.", 30],
    ],
  },
];

const DEFAULT_STEPS: StepSeed[] = [
  ["Stand up", "That's it. Just get vertical. This step counts.", 60],
  ["Do the first physical piece", "Touch the thing. Pick up the first object involved.", 90],
  ["Set out what the task needs", "Gather, don't do. Staging is progress.", 120],
  ["Do two minutes — then decide", "After two minutes you can stop. (You won't want to.)", 120],
];

const SPLIT_STEPS: StepSeed[] = [
  ["Just touch it", "Pick up or open the first thing involved. 20 seconds.", 30],
  ["Do the first half only", "Halfway is a real place. Aim there.", 60],
  ["Finish it or park it", "Either one counts as done for today.", 60],
];

function makeSteps(taskId: string, seeds: StepSeed[], lowEnergy: boolean): MicroStep[] {
  return seeds.map(([title, detail, seconds], i) => ({
    id: nextId("step"),
    taskId,
    orderIndex: i,
    title,
    detail,
    estimatedSeconds: lowEnergy ? Math.max(30, Math.round(seconds * 0.7)) : seconds,
    status: "todo" as const,
  }));
}

function createTask(input: {
  title: string;
  source: "text" | "photo";
  seeds: StepSeed[];
  lowEnergy: boolean;
  observations?: string[];
}): Task {
  const id = nextId("task");
  const task: Task = {
    id,
    title: input.title,
    source: input.source,
    vibeCheck:
      (input.lowEnergy ? "Low-battery mode: extra-small steps today. " : "") +
      VIBECHECKS[vibeIdx++ % VIBECHECKS.length],
    observations: input.observations ?? null,
    status: "ready",
    createdAt: new Date().toISOString(),
    completedAt: null,
    steps: makeSteps(id, input.seeds, input.lowEnergy),
  };
  state.tasks.set(id, task);
  return task;
}

// ---------- request dispatcher ----------

function requireMe(): Me {
  if (!state.me) throw new DemoApiError(401, { error: "unauthenticated" });
  return state.me;
}

export async function demoRequest<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  // Simulated latency keeps loading states honest.
  await new Promise((r) => setTimeout(r, 220));
  const method = (init?.method ?? "GET").toUpperCase();
  const body = (init?.json ?? {}) as Record<string, unknown>;
  const [route = path, query = ""] = path.split("?");

  if (route === "/api/me" && method === "GET") return withStreak(requireMe()) as T;
  if (route === "/api/me" && method === "PATCH") {
    const me = requireMe();
    if (typeof body.coachTone === "string") state.coachTone = body.coachTone;
    state.me = {
      ...me,
      coachTone: (body.coachTone as string) ?? me.coachTone,
      timezone: (body.timezone as string) ?? me.timezone,
      onboardedAt: body.onboarded ? new Date().toISOString() : me.onboardedAt,
    };
    return withStreak(state.me) as T;
  }
  if (route === "/api/me" && method === "DELETE") {
    demoReset();
    return {} as T;
  }

  if (route === "/api/ai/breakdown" && method === "POST") {
    requireMe();
    const lowEnergy = body.energyLevel === 1;
    if (typeof body.splitStepId === "string") {
      const parent = [...state.tasks.values()].find((t) =>
        t.steps.some((s) => s.id === body.splitStepId),
      );
      return createTask({
        title: parent?.title ?? String(body.title ?? "The thing"),
        source: "text",
        seeds: SPLIT_STEPS,
        lowEnergy,
      }) as T;
    }
    const title = String(body.title ?? "The thing");
    const template = TEMPLATES.find((t) => t.match.test(title));
    return createTask({
      title,
      source: "text",
      seeds: template?.steps ?? DEFAULT_STEPS,
      lowEnergy,
    }) as T;
  }

  if (route === "/api/ai/photo-plan" && method === "POST") {
    requireMe();
    return createTask({
      title: "Reset the counter",
      source: "photo",
      seeds: TEMPLATES[3]?.steps ?? DEFAULT_STEPS,
      lowEnergy: body.energyLevel === 1,
      observations: ["a backpack", "the permission slip pile", "three mugs", "unopened mail"],
    }) as T;
  }

  if (route === "/api/tasks" && method === "GET") {
    requireMe();
    const status = new URLSearchParams(query).get("status");
    const all = [...state.tasks.values()].reverse();
    return (status ? all.filter((t) => t.status === status) : all) as T;
  }

  const taskMatch = route.match(/^\/api\/tasks\/([^/]+)$/);
  if (taskMatch) {
    requireMe();
    const task = state.tasks.get(taskMatch[1] ?? "");
    if (!task) throw new DemoApiError(404, { error: "not found" });
    if (method === "PATCH") {
      task.status = body.status as Task["status"];
      if (task.status === "done") {
        task.completedAt = new Date().toISOString();
        markTodayActive();
      }
    }
    return task as T;
  }

  const stepMatch = route.match(/^\/api\/steps\/([^/]+)$/);
  if (stepMatch && method === "PATCH") {
    requireMe();
    for (const task of state.tasks.values()) {
      const step = task.steps.find((s) => s.id === stepMatch[1]);
      if (step) {
        step.status = body.status as MicroStep["status"];
        if (task.status === "ready") task.status = "in_progress";
        return step as T;
      }
    }
    throw new DemoApiError(404, { error: "not found" });
  }

  if (route === "/api/sessions" && method === "POST") {
    requireMe();
    const id = nextId("session");
    state.sessions.set(id, String(body.taskId ?? ""));
    return { id } as T;
  }

  const sessionMatch = route.match(/^\/api\/sessions\/([^/]+)$/);
  if (sessionMatch && method === "PATCH") {
    requireMe();
    state.minutesFocused += Math.round(Number(body.durationSeconds ?? 0) / 60);
    state.sessionCount += 1;
    if (Number(body.stepsCompleted ?? 0) > 0) markTodayActive();
    return { session: {}, streak: { currentStreak: streakView().currentStreak, usedFreeze: false } } as T;
  }

  if (route === "/api/streak" && method === "GET") {
    requireMe();
    return streakView() as T;
  }

  if (route === "/api/recap/weekly" && method === "GET") {
    requireMe();
    const tasks = [...state.tasks.values()];
    const done = tasks.filter((t) => t.status === "done").length;
    const steps = tasks.flatMap((t) => t.steps).filter((s) => s.status === "done").length;
    const recap: WeeklyRecap = {
      weekStart: dayKey(6),
      tasksStarted: tasks.length,
      tasksDone: done,
      stepsCompleted: steps,
      minutesFocused: state.minutesFocused,
      sessions: state.sessionCount,
      activeDays: streakView().days.length,
      oneLiner:
        done > 0
          ? `${done} thing${done === 1 ? "" : "s"} DONE. The dread never stood a chance.`
          : "The week is young. One tiny step starts it.",
    };
    return recap as T;
  }

  if (route === "/api/cards" && method === "POST") return { id: nextId("card") } as T;
  if (route.startsWith("/api/cards/") && method === "PATCH") return {} as T;

  throw new DemoApiError(404, { error: `demo: unhandled ${method} ${route}` });
}

// ---------- auth ----------

function demoReset() {
  state.me = null;
  state.tasks.clear();
  state.sessions.clear();
  state.activeDays.clear();
  state.minutesFocused = 0;
  state.sessionCount = 0;
}

/**
 * Just enough of the better-auth client surface for the screens that use it.
 * Any email works; any 6-digit code verifies. Sign-in seeds a 3-day streak so
 * the stats screens feel lived-in.
 */
export const demoAuthClient = {
  emailOtp: {
    sendVerificationOtp: async (_input: { email: string; type: string }) => ({
      data: { success: true },
      error: null,
    }),
  },
  signIn: {
    emailOtp: async ({ email }: { email: string; otp: string }) => {
      state.me = {
        id: nextId("user"),
        email,
        coachTone: state.coachTone,
        timezone: "America/New_York",
        onboardedAt: null,
        subscription: null,
        streak: { currentStreak: 0, longestStreak: 0, freezesAvailable: 0 },
      };
      for (const offset of [1, 2, 3]) state.activeDays.add(dayKey(offset));
      return { data: { user: { id: state.me.id } }, error: null };
    },
  },
  signOut: async () => {
    demoReset();
    return { data: null, error: null };
  },
};

// ---------- coach ----------

const STEP_DONE_LINES = [
  "One down. See? Smaller than it felt.",
  "That's momentum. Ride it into the next one.",
  "Look at you, doing the thing. Keep rolling.",
];
const STUCK_LINES = [
  "Heard. Forget the whole list — just this step, for 60 seconds.",
  "Boring is fine. Boring still counts. Ten more seconds of it.",
  "Then make it dumber: do only the first physical motion of it.",
];
let doneIdx = 0;
let stuckIdx = 0;

export function demoCoachReply(text: string, ctx: SessionContext): string {
  if (text.includes("[event:session_started]"))
    return `Step one is tiny on purpose: "${ctx.stepTitle}". Just start — I'm right here.`;
  if (text.includes("[event:step_completed]"))
    return STEP_DONE_LINES[doneIdx++ % STEP_DONE_LINES.length] ?? STEP_DONE_LINES[0]!;
  if (text.includes("[event:idle_60s]"))
    return "Still there? No judgment. Do the first ten seconds and we'll call it started.";
  return STUCK_LINES[stuckIdx++ % STUCK_LINES.length] ?? STUCK_LINES[0]!;
}
