import { useMemo } from "react";
import { Platform } from "react-native";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { API_URL } from "../lib/env";
import { sessionCookie } from "../lib/authClient";
import type { SessionContext } from "@dtt/shared/schemas/ai";

/**
 * Streaming coach chat. React Native's built-in fetch cannot stream —
 * `expo/fetch` MUST be injected into the transport or replies arrive only
 * after completion (the #1 integration gotcha on this stack).
 */
export function useCoachChat(getContext: () => SessionContext) {
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
