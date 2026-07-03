import { Redirect, Stack } from "expo-router";
import { useAppState } from "../../src/state/appState";

/** Everything in (app) requires the pro entitlement — hard paywall. */
export default function AppLayout() {
  const { me, isPro } = useAppState();

  if (!me) return <Redirect href="/(onboarding)" />;
  if (!isPro) return <Redirect href="/(auth)/paywall" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#070B09" },
        animation: "slide_from_right",
      }}
    />
  );
}
