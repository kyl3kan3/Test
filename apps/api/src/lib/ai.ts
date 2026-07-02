import { createProviderRegistry, type LanguageModel } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { MockLanguageModelV4, simulateReadableStream } from "ai/test";
import type {
  LanguageModelV4FinishReason,
  LanguageModelV4StreamPart,
  LanguageModelV4Usage,
} from "@ai-sdk/provider";

const registry = createProviderRegistry({ anthropic, openai });

const DEFAULT_MODEL = "anthropic:claude-sonnet-5";
const DEFAULT_CHEAP_MODEL = "anthropic:claude-haiku-4-5";

const MOCK_USAGE: LanguageModelV4Usage = {
  inputTokens: {
    total: 100,
    noCache: 100,
    cacheRead: undefined,
    cacheWrite: undefined,
  },
  outputTokens: { total: 50, text: 50, reasoning: undefined },
};

const MOCK_FINISH: LanguageModelV4FinishReason = {
  unified: "stop",
  raw: undefined,
};

const MOCK_BREAKDOWN = {
  taskSummary: "Reset the desk",
  vibeCheck:
    "Starting is the hard part for an ADHD brain — the task itself is smaller than it feels.",
  steps: [
    {
      title: "Stand up",
      detail: "That's it. Just get vertical. This step counts.",
      estimatedSeconds: 30,
    },
    {
      title: "Clear one mug",
      detail: "Take the nearest mug or cup to the kitchen.",
      estimatedSeconds: 60,
    },
    {
      title: "Stack loose papers",
      detail: "One pile. Don't sort them, stacking is enough.",
      estimatedSeconds: 120,
    },
    {
      title: "Wipe the surface",
      detail: "One pass with anything — a sleeve counts in emergencies.",
      estimatedSeconds: 90,
    },
  ],
};

const MOCK_OBSERVATIONS = ["papers on the desk", "two mugs by the monitor"];

function isPhotoCall(options: { prompt: unknown }): boolean {
  return JSON.stringify(options.prompt).includes("PHOTO");
}

/** Deterministic model for tests and e2e — no network, stable fixtures. */
function mockModel(): LanguageModel {
  return new MockLanguageModelV4({
    provider: "mock",
    modelId: "mock-model",
    doGenerate: async (options) => {
      const object = isPhotoCall(options)
        ? { ...MOCK_BREAKDOWN, observations: MOCK_OBSERVATIONS }
        : MOCK_BREAKDOWN;
      return {
        content: [{ type: "text" as const, text: JSON.stringify(object) }],
        finishReason: MOCK_FINISH,
        usage: MOCK_USAGE,
        warnings: [],
      };
    },
    doStream: async () => ({
      stream: simulateReadableStream<LanguageModelV4StreamPart>({
        chunks: [
          { type: "stream-start", warnings: [] },
          { type: "text-start", id: "t1" },
          { type: "text-delta", id: "t1", delta: "You've got this. " },
          { type: "text-delta", id: "t1", delta: "One tiny step." },
          { type: "text-end", id: "t1" },
          {
            type: "finish",
            finishReason: MOCK_FINISH,
            usage: MOCK_USAGE,
          },
        ],
        chunkDelayInMs: 5,
      }),
    }),
  });
}

export function isMockMode(): boolean {
  return (process.env.AI_MODEL ?? "") === "mock";
}

export function getModel(kind: "main" | "cheap" = "main"): LanguageModel {
  if (isMockMode()) return mockModel();
  const id =
    kind === "cheap"
      ? (process.env.AI_MODEL_CHEAP ?? DEFAULT_CHEAP_MODEL)
      : (process.env.AI_MODEL ?? DEFAULT_MODEL);
  return registry.languageModel(id as Parameters<typeof registry.languageModel>[0]);
}

export function modelLabel(kind: "main" | "cheap" = "main"): string {
  if (isMockMode()) return "mock";
  return kind === "cheap"
    ? (process.env.AI_MODEL_CHEAP ?? DEFAULT_CHEAP_MODEL)
    : (process.env.AI_MODEL ?? DEFAULT_MODEL);
}

export function aiDisabled(): boolean {
  return process.env.AI_DISABLED === "1";
}
