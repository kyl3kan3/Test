import { create } from "zustand";

export type QuizAnswers = {
  diagnosis?: string;
  paralysisFrequency?: string;
  worstTaskTypes?: string[];
  triedBefore?: string[];
  hypeStyle?: string;
  peakDreadTime?: string;
  goal?: string;
};

export type CoachTone = "gentle_cheerleader" | "chaotic_bestie" | "calm_steady";

type OnboardingState = {
  answers: QuizAnswers;
  setAnswer: <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => void;
  coachTone: () => CoachTone;
  archetype: () => { name: string; blurb: string };
  reset: () => void;
};

const TONE_BY_HYPE: Record<string, CoachTone> = {
  "Gentle hype — soft, encouraging, never loud": "gentle_cheerleader",
  "Chaotic bestie — funny, unhinged, on my side": "chaotic_bestie",
  "Calm & steady — quiet confidence, no exclamation points": "calm_steady",
};

// Quiz option groups that drive the archetype reveal. Every worstTaskTypes
// option has exactly one owner so no answer combination falls through to a
// generic identity by accident.
const CEO_TASKS = [
  "School stuff — forms, portals, the class group chat",
  "Meal planning & feeding people",
  "Doctor, dentist, vet, whoever needs booking",
];
const CLOSER_TASKS = ["Household admin — bills, insurance, the inbox"];
const BACKLOG_TASKS = [
  "The kids' laundry pile",
  "Cleaning",
  "Errands",
  "Self-care (yes, that counts too)",
];

export const useOnboarding = create<OnboardingState>((set, get) => ({
  answers: {},
  setAnswer: (key, value) =>
    set((s) => ({ answers: { ...s.answers, [key]: value } })),
  coachTone: () =>
    TONE_BY_HYPE[get().answers.hypeStyle ?? ""] ?? "gentle_cheerleader",
  archetype: () => {
    const types = get().answers.worstTaskTypes ?? [];
    if (CEO_TASKS.some((t) => types.includes(t))) {
      return {
        name: "Household CEO",
        blurb:
          "You're running a small unpaid operation — logistics, health, school admin, morale — mostly from memory, mostly solo, on a brain that never got the onboarding doc. We're not one more line on the list. We're the thing that gets the list moving.",
      };
    }
    if (CLOSER_TASKS.some((t) => types.includes(t))) {
      return {
        name: "The Deadline Closer",
        blurb:
          "You can execute under real pressure — the bill paid from the parking lot, the reply sent right before the deadline. The problem is everything that exists before the deadline shows up. We make 'right now' feel like the due date, on command.",
      };
    }
    if (BACKLOG_TASKS.some((t) => types.includes(t))) {
      return {
        name: "The Backlog Runner",
        blurb:
          "The house needs things from you faster than your brain will hand over the keys to start — the laundry pile, the errands, the counter under yesterday's mail. The backlog isn't proof of anything except that your brain needs a smaller on-ramp. We build one so small the stall can't get a grip.",
      };
    }
    return {
      name: "Unstoppable, Once Started",
      blurb:
        "Once you're moving, nothing stops you — the entire bottleneck is minute one, while three people and a group chat are pulling at you at once. That's the exact minute this app is built for.",
    };
  },
  reset: () => set({ answers: {} }),
}));
