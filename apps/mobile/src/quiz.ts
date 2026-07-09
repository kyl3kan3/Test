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
    sub: "Diagnosed, self-suspected, or you saw one video about moms and ADHD and had to sit down for a second.",
    options: [
      "Officially diagnosed",
      "Self-diagnosed, no notes",
      "Still figuring it out",
      "I'm here for someone I love",
    ],
  },
  {
    key: "paralysisFrequency",
    question: "How often do you stare at a task and completely freeze?",
    sub: "Even when everything else is somehow handled — kids fed, dog walked, inbox not actively on fire.",
    options: [
      "Basically daily",
      "A few times a week",
      "About once a week",
      "Only on the big scary ones",
    ],
  },
  {
    key: "worstTaskTypes",
    question: "Which tasks glue you to the couch?",
    sub: "Pick everything that's true right now — this isn't a test.",
    options: [
      "School stuff — forms, portals, the class group chat",
      "Meal planning & feeding people",
      "Doctor, dentist, vet, whoever needs booking",
      "Household admin — bills, insurance, the inbox",
      "The kids' laundry pile",
      "Cleaning",
      "Errands",
      "Self-care (yes, that counts too)",
    ],
    multi: true,
  },
  {
    key: "triedBefore",
    question: "What have you already thrown at this?",
    sub: "Pick all that apply",
    options: [
      "To-do apps that guilt-trip me",
      "Body doubling",
      "Medication",
      "Timers & alarms",
      "Chore charts / family apps",
      "Hiring help I couldn't keep up with",
      "Honestly, everything",
    ],
    multi: true,
  },
  {
    key: "hypeStyle",
    question: "How should your coach talk to you?",
    sub: "Pick whichever one wouldn't add to the guilt pile.",
    options: [
      "Gentle hype — soft, encouraging, never loud",
      "Chaotic bestie — funny, unhinged, on my side",
      "Calm & steady — quiet confidence, no exclamation points",
    ],
  },
  {
    key: "peakDreadTime",
    question: "When does the dread hit hardest?",
    options: [
      "The morning scramble",
      "The 3-6pm witching hour — pickup, dinner, everyone needing something",
      "After everyone's finally asleep",
      "Honestly, all day",
    ],
  },
  {
    key: "goal",
    question: "Two weeks from now, what does 'better' look like?",
    options: [
      "I stop being the only functioning adult in the house",
      "The admin pile — permission slips, bills, forms — is actually handled",
      "I start things without the two-hour spiral first",
      "My space stops working against me",
      "I trust myself to follow through, no reminders needed",
    ],
  },
];
