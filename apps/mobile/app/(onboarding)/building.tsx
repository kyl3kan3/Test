import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Screen } from "../../src/components/ui/Screen";
import { Button } from "../../src/components/ui/Button";
import { ProgressBar } from "../../src/components/ProgressBar";
import { useOnboarding } from "../../src/state/onboarding";

const BUILD_LINES = [
  "Reading your answers…",
  "Calibrating step sizes for your brain — and your actual day…",
  "Teaching your coach how to hype you, interruptions and all…",
];

export default function Building() {
  const archetype = useOnboarding((s) => s.archetype)();
  const [phase, setPhase] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 1600),
      setTimeout(() => setDone(true), 2500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  if (!done) {
    return (
      <Screen>
        <View className="flex-1 justify-center">
          <ProgressBar progress={(phase + 1) / 3} />
          <Text className="font-body-medium text-lg text-ink mt-6">
            {BUILD_LINES[phase]}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Animated.View entering={FadeInUp.springify()}>
          <Text className="font-body text-sm text-primary uppercase tracking-widest">
            Your starter plan is ready
          </Text>
          <Text className="font-display text-3xl text-ink mt-3 leading-[44px]">
            You're a {archetype.name}
          </Text>
          <Text className="font-body text-base text-ink-dim mt-4 leading-6">
            {archetype.blurb}
          </Text>
          <View className="mt-8 rounded-2xl bg-surface border border-line p-5">
            {[
              "Steps so small they feel silly — that's the point",
              "A coach in your ear while you start",
              "Streaks that forgive a bad day",
            ].map((line) => (
              <Text key={line} className="font-body text-base text-ink py-1.5">
                ✓ {line}
              </Text>
            ))}
          </View>
        </Animated.View>
      </View>
      <Button
        testID="building-continue"
        label="Save my plan"
        big
        onPress={() => router.push("/(auth)/signup")}
      />
    </Screen>
  );
}
