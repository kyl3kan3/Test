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
  "Gentle cheerleader": "gentle_cheerleader",
  "Chaotic bestie": "chaotic_bestie",
  "Calm & steady": "calm_steady",
};

export const useOnboarding = create<OnboardingState>((set, get) => ({
  answers: {},
  setAnswer: (key, value) =>
    set((s) => ({ answers: { ...s.answers, [key]: value } })),
  coachTone: () =>
    TONE_BY_HYPE[get().answers.hypeStyle ?? ""] ?? "gentle_cheerleader",
  archetype: () => {
    const a = get().answers;
    const types = a.worstTaskTypes ?? [];
    if (types.includes("Cleaning") || types.includes("Errands")) {
      return {
        name: "Overwhelmed Optimist",
        blurb:
          "You want to do the thing — your brain won't hand you the keys. We start comically small.",
      };
    }
    if (types.includes("Emails/admin") || types.includes("Starting work")) {
      return {
        name: "Deadline Diver",
        blurb:
          "You can do anything at the last minute. We make 'right now' feel like a deadline — the fun kind.",
      };
    }
    return {
      name: "Momentum Seeker",
      blurb:
        "Once you start, you're unstoppable. Your whole problem is minute one. That's exactly what we fix.",
    };
  },
  reset: () => set({ answers: {} }),
}));
