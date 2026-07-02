import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/ui/Screen";
import { Button } from "../../src/components/ui/Button";
import { Aurora } from "../../src/components/Aurora";
import { PaywallFooter } from "../../src/components/PaywallFooter";
import { TrialTimeline } from "../../src/components/TrialTimeline";
import {
  presentPaywall,
  purchasesAvailable,
  restorePurchases,
} from "../../src/lib/purchases";
import { useAppState } from "../../src/state/appState";
import { useOnboarding } from "../../src/state/onboarding";

/**
 * Hard paywall — no path into the app without the `pro` entitlement.
 * On device this presents RevenueCat's remote paywall (prices/copy managed in
 * the RC dashboard, incl. full price + renewal term). The screen behind it
 * carries the compliance footer and a sign-in link for existing subscribers.
 */
export default function Paywall() {
  const [busy, setBusy] = useState(false);
  const setPro = useAppState((s) => s.setPro);
  const archetype = useOnboarding((s) => s.archetype)();

  const buy = async () => {
    setBusy(true);
    try {
      const isPro = await presentPaywall();
      if (isPro) {
        setPro(true);
        router.replace("/(app)");
      }
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    const isPro = await restorePurchases();
    if (isPro) {
      setPro(true);
      router.replace("/(app)");
    } else {
      Alert.alert("No purchases found", "No active subscription on this account.");
    }
  };

  return (
    <Screen scroll>
      <Aurora />
      <View className="flex-1 justify-center pt-6">
        <Text className="font-body-semibold text-xs text-primary uppercase tracking-widest">
          One step left
        </Text>
        <Text className="font-display text-3xl text-ink mt-3 leading-[46px]">
          Unlock{"\n"}
          <Text className="text-primary">your coach</Text>
        </Text>
        <View className="mt-6 gap-2.5">
          {[
            "Unlimited AI task breakdowns",
            "Live body-double focus sessions",
            "Photo-of-the-mess planning",
            "Streaks that forgive rest days",
          ].map((line) => (
            <View key={line} className="flex-row items-center gap-3">
              <View className="h-5 w-5 items-center justify-center rounded-md bg-success/15">
                <Text className="font-body-semibold text-[11px] text-success">✓</Text>
              </View>
              <Text className="font-body text-[15px] text-ink">{line}</Text>
            </View>
          ))}
        </View>

        <View className="mt-6 rounded-2xl border-[1.5px] border-primary bg-primary/10 p-4">
          <View className="absolute -top-2.5 right-4 rounded-md bg-hype px-2 py-0.5">
            <Text className="font-body-semibold text-[9px] tracking-widest text-on-primary">
              SAVE 52%
            </Text>
          </View>
          <Text className="font-body-semibold text-base text-ink">Yearly · $39.99</Text>
          <Text className="font-body text-xs text-ink-dim mt-1">
            3-day free trial, then $3.33/mo billed yearly. Auto-renews.
          </Text>
        </View>
        <View className="mt-2.5 rounded-2xl border border-line bg-surface p-4">
          <Text className="font-body-semibold text-base text-ink">Monthly · $6.99</Text>
          <Text className="font-body text-xs text-ink-dim mt-1">
            Auto-renews monthly. Cancel anytime.
          </Text>
        </View>

        <TrialTimeline />

        {!purchasesAvailable ? (
          <Text className="font-body text-xs text-ink-dim mt-4">
            Store purchases run on the installed app. This build uses a test
            entitlement.
          </Text>
        ) : null}
      </View>
      <View className="mt-6">
        <Button
          testID="paywall-continue"
          label="Start my 3 free days"
          big
          loading={busy}
          onPress={buy}
        />
      </View>
      <Text
        testID="paywall-signin"
        className="font-body text-sm text-ink-dim text-center py-3"
        onPress={() => router.push("/(auth)/login")}
      >
        Already subscribed? Sign in
      </Text>
      <PaywallFooter onRestore={restore} />
    </Screen>
  );
}
