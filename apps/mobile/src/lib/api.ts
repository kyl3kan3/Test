import { API_URL, IS_DEMO } from "./env";
import { sessionCookie } from "./authClient";
import { demoRequest } from "./demoApi";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: any,
  ) {
    super(`API ${status}: ${JSON.stringify(body)}`);
  }
}

async function request<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  if (IS_DEMO) return demoRequest<T>(path, init);
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  };
  const cookie = sessionCookie();
  if (cookie) headers.Cookie = cookie;

  let body = init?.body;
  if (init?.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.json);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    body,
    credentials: "include",
  });

  const text = await res.text();
  const parsed = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, parsed);
  return parsed as T;
}

export type MicroStep = {
  id: string;
  taskId: string;
  orderIndex: number;
  title: string;
  detail: string | null;
  estimatedSeconds: number;
  status: "todo" | "done" | "skipped";
};

export type Task = {
  id: string;
  title: string;
  source: "text" | "photo";
  vibeCheck: string | null;
  observations: string[] | null;
  status: "ready" | "in_progress" | "done" | "abandoned";
  createdAt: string;
  completedAt: string | null;
  steps: MicroStep[];
};

export type StreakView = {
  currentStreak: number;
  longestStreak: number;
  freezesAvailable: number;
  lastActiveDate: string | null;
  days: { day: string; kind: "active" | "freeze" }[];
};

export type WeeklyRecap = {
  weekStart: string;
  tasksStarted: number;
  tasksDone: number;
  stepsCompleted: number;
  minutesFocused: number;
  sessions: number;
  activeDays: number;
  oneLiner: string;
};

export type Me = {
  id: string;
  email: string;
  coachTone: string | null;
  timezone: string | null;
  onboardedAt: string | null;
  subscription: { status: string; expiresAt: string | null } | null;
  streak: {
    currentStreak: number;
    longestStreak: number;
    freezesAvailable: number;
  };
};

export const api = {
  me: () => request<Me>("/api/me"),
  patchMe: (patch: unknown) =>
    request("/api/me", { method: "PATCH", json: patch }),
  deleteMe: () => request("/api/me", { method: "DELETE" }),

  breakdown: (input: {
    title: string;
    context?: string;
    energyLevel?: number;
    splitStepId?: string;
  }) => request<Task>("/api/ai/breakdown", { method: "POST", json: input }),

  photoPlan: (input: {
    imageBase64: string;
    mimeType: string;
    hint?: string;
    energyLevel?: number;
  }) => request<Task>("/api/ai/photo-plan", { method: "POST", json: input }),

  tasks: (status?: string) =>
    request<Task[]>(`/api/tasks${status ? `?status=${status}` : ""}`),
  task: (id: string) => request<Task>(`/api/tasks/${id}`),
  patchTask: (id: string, status: string) =>
    request<Task>(`/api/tasks/${id}`, { method: "PATCH", json: { status } }),
  patchStep: (id: string, status: string) =>
    request<MicroStep>(`/api/steps/${id}`, { method: "PATCH", json: { status } }),

  startSession: (taskId: string) =>
    request<{ id: string }>("/api/sessions", { method: "POST", json: { taskId } }),
  endSession: (id: string, body: { stepsCompleted: number; durationSeconds: number }) =>
    request<{ session: unknown; streak: { currentStreak: number; usedFreeze: boolean } | null }>(
      `/api/sessions/${id}`,
      { method: "PATCH", json: body },
    ),

  streak: () => request<StreakView>("/api/streak"),
  weeklyRecap: () => request<WeeklyRecap>("/api/recap/weekly"),

  logCard: (body: { taskId?: string; cardType: string }) =>
    request<{ id: string }>("/api/cards", { method: "POST", json: body }),
  markCardShared: (id: string) =>
    request(`/api/cards/${id}`, { method: "PATCH", json: {} }),
};
