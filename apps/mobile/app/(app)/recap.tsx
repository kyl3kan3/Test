import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Screen } from "../../src/components/ui/Screen";
import { Button } from "../../src/components/ui/Button";
import { api, type WeeklyRecap } from "../../src/lib/api";

export default function Recap() {
  const [recap, setRecap] = useState<WeeklyRecap | null>(null);

  useEffect(() => {
    api.weeklyRecap().then(setRecap).catch(() => {});
  }, []);

  return (
    <Screen scroll>
      <Pressable testID="recap-back" onPress={() => router.back()}>
        <Text className="font-body text-base text-ink-dim">← Back</Text>
      </Pressable>

      <Text className="font-body text-sm text-primary uppercase tracking-widest mt-8">
        This week, wrapped
      </Text>

      {recap ? (
        <View>
          <Animated.View entering={FadeInUp.springify()}>
            <Text testID="recap-oneliner" className="font-display-medium text-2xl text-ink mt-4 leading-9">
              {recap.oneLiner}
            </Text>
          </Animated.View>

          <View className="flex-row flex-wrap mt-8" style={{ gap: 12 }}>
            {[
              { label: "things started", value: recap.tasksStarted },
              { label: "things DONE", value: recap.tasksDone },
              { label: "tiny steps", value: recap.stepsCompleted },
              { label: "minutes focused", value: recap.minutesFocused },
              { label: "sessions", value: recap.sessions },
              { label: "active days", value: recap.activeDays },
            ].map((stat, i) => (
              <Animated.View
                key={stat.label}
                entering={FadeInUp.delay(i * 70).springify()}
                className="rounded-2xl bg-surface border border-line px-5 py-4 min-w-[45%]"
              >
                <Text className="font-display-medium text-3xl text-primary">
                  {stat.value}
                </Text>
                <Text className="font-body text-xs text-ink-dim mt-1">{stat.label}</Text>
              </Animated.View>
            ))}
          </View>

          <View className="mt-8">
            <Button
              testID="recap-home"
              label="Keep going"
              big
              onPress={() => router.back()}
            />
          </View>
        </View>
      ) : (
        <Text className="font-body text-base text-ink-dim mt-6">
          Crunching your week…
        </Text>
      )}
    </Screen>
  );
}
