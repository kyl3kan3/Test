import type { QuizAnswers } from "./state/onboarding";

export type QuizStep = {
  key: keyof QuizAnswers;
  question: string;
  sub?: string;
  options: string[];
  multi?: boolean;
};

export const QUIZ_STEPS: QuizStep[] = [
  {
    key: "diagnosis",
    question: "Do you have ADHD?",
    sub: "Diagnosed, suspected, or just recognizing yourself in every mom-with-ADHD video",
    options: ["Diagnosed", "Self-identified", "Still exploring", "Supporting someone"],
  },
  {
    key: "paralysisFrequency",
    question: "How often do you stare at a task and just… can't?",
    sub: "Even with the kids fed, the day covered, everything else somehow done",
    options: ["Basically daily", "A few times a week", "About weekly"],
  },
  {
    key: "worstTaskTypes",
    question: "Which tasks glue you to the couch?",
    sub: "Pick all that apply",
    options: [
      "Cleaning",
      "Kids & family logistics",
      "Emails/admin",
      "Starting work",
      "Errands",
      "Self-care",
    ],
    multi: true,
  },
  {
    key: "triedBefore",
    question: "What have you already tried?",
    sub: "Pick all that apply",
    options: ["To-do apps", "Body doubling", "Meds", "Timers", "Literally everything"],
    multi: true,
  },
  {
    key: "hypeStyle",
    question: "How should your coach talk to you?",
    options: ["Gentle cheerleader", "Chaotic bestie", "Calm & steady"],
  },
  {
    key: "peakDreadTime",
    question: "When does the dread hit hardest?",
    options: ["Morning", "Afternoon", "Evening"],
  },
  {
    key: "goal",
    question: "Two weeks from now, what does 'better' look like?",
    options: [
      "I start things without the 2-hour spiral",
      "My space stops stressing me out",
      "The admin pile is gone",
      "I'm not the only one holding it together",
      "I trust myself to follow through",
    ],
  },
];
