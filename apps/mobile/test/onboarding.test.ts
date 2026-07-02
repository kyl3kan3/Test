import { useOnboarding } from "../src/state/onboarding";
import { QUIZ_STEPS } from "../src/quiz";

describe("quiz definition", () => {
  it("has 7 steps with unique keys and 2+ options each", () => {
    expect(QUIZ_STEPS).toHaveLength(7);
    const keys = QUIZ_STEPS.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const step of QUIZ_STEPS) {
      expect(step.options.length).toBeGreaterThanOrEqual(2);
      expect(step.question.length).toBeGreaterThan(5);
    }
  });

  it("includes the coach-tone question mapped to hypeStyle", () => {
    const hype = QUIZ_STEPS.find((s) => s.key === "hypeStyle");
    expect(hype?.options).toEqual([
      "Gentle cheerleader",
      "Chaotic bestie",
      "Calm & steady",
    ]);
  });
});

describe("onboarding store", () => {
  beforeEach(() => useOnboarding.getState().reset());

  it("stores answers and derives coach tone", () => {
    const store = useOnboarding.getState();
    store.setAnswer("hypeStyle", "Chaotic bestie");
    expect(useOnboarding.getState().coachTone()).toBe("chaotic_bestie");
  });

  it("defaults tone to gentle_cheerleader", () => {
    expect(useOnboarding.getState().coachTone()).toBe("gentle_cheerleader");
  });

  it("derives archetypes from worst task types", () => {
    const store = useOnboarding.getState();
    store.setAnswer("worstTaskTypes", ["Cleaning"]);
    expect(useOnboarding.getState().archetype().name).toBe("Overwhelmed Optimist");

    store.setAnswer("worstTaskTypes", ["Emails/admin"]);
    expect(useOnboarding.getState().archetype().name).toBe("Deadline Diver");

    store.setAnswer("worstTaskTypes", ["Self-care"]);
    expect(useOnboarding.getState().archetype().name).toBe("Momentum Seeker");
  });
});
