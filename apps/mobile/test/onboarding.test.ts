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
      "Gentle hype — soft, encouraging, never loud",
      "Chaotic bestie — funny, unhinged, on my side",
      "Calm & steady — quiet confidence, no exclamation points",
    ]);
  });
});

describe("onboarding store", () => {
  beforeEach(() => useOnboarding.getState().reset());

  it("stores answers and derives coach tone", () => {
    const store = useOnboarding.getState();
    store.setAnswer("hypeStyle", "Chaotic bestie — funny, unhinged, on my side");
    expect(useOnboarding.getState().coachTone()).toBe("chaotic_bestie");
  });

  it("defaults tone to gentle_cheerleader", () => {
    expect(useOnboarding.getState().coachTone()).toBe("gentle_cheerleader");
  });

  it("derives archetypes from worst task types", () => {
    const store = useOnboarding.getState();
    store.setAnswer("worstTaskTypes", [
      "School stuff — forms, portals, the class group chat",
    ]);
    expect(useOnboarding.getState().archetype().name).toBe("Household CEO");

    store.setAnswer("worstTaskTypes", ["Household admin — bills, insurance, the inbox"]);
    expect(useOnboarding.getState().archetype().name).toBe("The Deadline Closer");

    store.setAnswer("worstTaskTypes", ["The kids' laundry pile"]);
    expect(useOnboarding.getState().archetype().name).toBe("The Backlog Runner");

    store.setAnswer("worstTaskTypes", []);
    expect(useOnboarding.getState().archetype().name).toBe(
      "Unstoppable, Once Started",
    );
  });

  it("every worstTaskTypes quiz option maps to a non-fallback archetype", () => {
    const store = useOnboarding.getState();
    const options =
      QUIZ_STEPS.find((s) => s.key === "worstTaskTypes")?.options ?? [];
    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      store.setAnswer("worstTaskTypes", [option]);
      expect(useOnboarding.getState().archetype().name).not.toBe(
        "Unstoppable, Once Started",
      );
    }
  });
});
