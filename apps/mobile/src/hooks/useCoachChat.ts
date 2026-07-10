import { useCallback, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { API_URL, IS_DEMO } from "../lib/env";
import { sessionCookie } from "../lib/authClient";
import { demoCoachReply } from "../lib/demoApi";
import type { SessionContext } from "@dtt/shared/schemas/ai";

/**
 * Streaming coach chat. React Native's built-in fetch cannot stream —
 * `expo/fetch` MUST be injected into the transport or replies arrive only
 * after completion (the #1 integration gotcha on this stack).
 */
function useRealChat(getContext: () => SessionContext) {
  const transport = useMemo(() => {
    const expoFetch =
      Platform.OS === "web"
        ? globalThis.fetch.bind(globalThis)
        : (require("expo/fetch").fetch as typeof globalThis.fetch);

    return new DefaultChatTransport({
      api: `${API_URL}/api/ai/chat`,
      fetch: expoFetch as unknown as typeof globalThis.fetch,
      credentials: "include",
      headers: (): Record<string, string> => {
        const cookie = sessionCookie();
        return cookie ? { Cookie: cookie } : {};
      },
      body: () => ({ sessionContext: getContext() }),
    });
    // getContext is intentionally read at send time, not construction time.
  }, []);

  return useChat({ transport });
}

/** Demo builds answer locally with canned coach lines — no network at all. */
function useDemoChat(getContext: () => SessionContext) {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  // Always read the freshest closure — callers pass a new one every render.
  const ctxRef = useRef(getContext);
  ctxRef.current = getContext;

  const sendMessage = useCallback(async ({ text }: { text: string }) => {
    const user: UIMessage = {
      id: `demo_u_${Date.now()}`,
      role: "user",
      parts: [{ type: "text", text }],
    };
    setMessages((m) => [...m, user]);
    const reply = demoCoachReply(text, ctxRef.current());
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: `demo_a_${Date.now()}`,
          role: "assistant",
          parts: [{ type: "text", text: reply }],
        },
      ]);
    }, 450);
  }, []);

  return { messages, sendMessage } as unknown as ReturnType<typeof useChat>;
}

export function useCoachChat(getContext: () => SessionContext) {
  // Both hooks run unconditionally (rules of hooks); IS_DEMO is a build-time
  // constant, and the unused one never touches the network.
  const real = useRealChat(getContext);
  const demo = useDemoChat(getContext);
  return IS_DEMO ? demo : real;
}
