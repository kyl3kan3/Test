import { Platform } from "react-native";

const enabled = Platform.OS !== "web";

async function run(fn: () => Promise<void>): Promise<void> {
  if (!enabled) return;
  try {
    await fn();
  } catch {
    // haptics are decorative — never crash for them
  }
}

export const haptics = {
  select: () =>
    run(async () => {
      const Haptics = await import("expo-haptics");
      await Haptics.selectionAsync();
    }),
  stepDone: () =>
    run(async () => {
      const Haptics = await import("expo-haptics");
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }),
  celebrate: () =>
    run(async () => {
      const Haptics = await import("expo-haptics");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }),
  soft: () =>
    run(async () => {
      const Haptics = await import("expo-haptics");
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }),
};
