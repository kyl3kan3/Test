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
        contentStyle: { backgroundColor: "#0D0D14" },
        animation: "slide_from_right",
      }}
    />
  );
}
