import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../../src/components/ui/Screen";
import { api, type StreakView } from "../../src/lib/api";

function last35Days(): string[] {
  const days: string[] = [];
  const d = new Date();
  for (let i = 34; i >= 0; i--) {
    const day = new Date(d);
    day.setDate(d.getDate() - i);
    days.push(day.toISOString().slice(0, 10));
  }
  return days;
}

export default function Streak() {
  const [view, setView] = useState<StreakView | null>(null);

  useEffect(() => {
    api.streak().then(setView).catch(() => {});
  }, []);

  const kinds = new Map((view?.days ?? []).map((d) => [d.day, d.kind]));

  return (
    <Screen scroll>
      <Pressable testID="streak-back" onPress={() => router.back()}>
        <Text className="font-body text-base text-ink-dim">← Back</Text>
      </Pressable>

      <View className="items-center mt-10">
        <Text className="font-display text-6xl text-hype">🔥</Text>
        <Text testID="streak-current" className="font-display text-5xl text-ink mt-3">
          {view?.currentStreak ?? 0}
        </Text>
        <Text className="font-body text-base text-ink-dim mt-2">
          day streak · longest {view?.longestStreak ?? 0}
        </Text>
        <View className="flex-row items-center mt-4 rounded-full bg-surface border border-line px-4 py-2">
          <Text className="font-body text-sm text-freeze">
            🧊 {view?.freezesAvailable ?? 0} freeze{(view?.freezesAvailable ?? 0) === 1 ? "" : "s"} banked
          </Text>
        </View>
      </View>

      <View className="mt-10">
        <Text className="font-body-semibold text-sm text-ink-dim uppercase tracking-widest">
          Last 5 weeks
        </Text>
        <View className="flex-row flex-wrap mt-4" style={{ gap: 8 }}>
          {last35Days().map((day) => {
            const kind = kinds.get(day);
            return (
              <View
                key={day}
                className={`h-10 w-10 rounded-lg items-center justify-center ${
                  kind === "active"
                    ? "bg-hype/80"
                    : kind === "freeze"
                      ? "bg-freeze/60"
                      : "bg-surface border border-line"
                }`}
              >
                <Text className="font-body text-[10px] text-ink-dim">
                  {Number(day.slice(8, 10))}
                </Text>
              </View>
            );
          })}
        </View>
        <Text className="font-body text-sm text-ink-dim mt-6 leading-5">
          Miss a day? A banked freeze covers it automatically. Your streak took a
          rest day — so did you. Still alive. 🧊
        </Text>
        <Text className="font-body text-xs text-ink-dim mt-2">
          Earn a freeze every 7 active days (max 2 banked).
        </Text>
      </View>
    </Screen>
  );
}
