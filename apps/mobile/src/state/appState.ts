import { create } from "zustand";
import type { Me } from "../lib/api";

/**
 * Root gating state: where should the router send the user?
 * loading -> onboarding -> auth -> paywall -> app
 */
type AppState = {
  me: Me | null;
  isPro: boolean;
  setMe: (me: Me | null) => void;
  setPro: (pro: boolean) => void;
};

export const useAppState = create<AppState>((set) => ({
  me: null,
  isPro: false,
  setMe: (me) =>
    set({
      me,
      // Server-side subscription state also unlocks (webhook may land before
      // the client SDK refreshes).
      ...(me?.subscription &&
      ["active", "trialing", "grace"].includes(me.subscription.status)
        ? { isPro: true }
        : {}),
    }),
  setPro: (isPro) => set({ isPro }),
}));
