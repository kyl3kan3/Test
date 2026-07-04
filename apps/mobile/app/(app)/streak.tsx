import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import Animated, { FadeInUp, ZoomIn } from "react-native-reanimated";
import { Screen } from "../../src/components/ui/Screen";
import { api, type StreakView } from "../../src/lib/api";

function lastNDays(n: number): string[] {
  const days: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const day = new Date(d);
    day.setDate(d.getDate() - i);
    days.push(day.toISOString().slice(0, 10));
  }
  return days;
}

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

/** Soft coral glow behind the streak flame — the screen's one bright moment. */
function FlameGlow() {
  return (
    <Svg width={220} height={220} style={{ position: "absolute" }}>
      <Defs>
        <RadialGradient id="fg" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FF7A59" stopOpacity="0.5" />
          <Stop offset="60%" stopColor="#E85F3F" stopOpacity="0.18" />
          <Stop offset="100%" stopColor="#E85F3F" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={110} cy={110} r={110} fill="url(#fg)" />
    </Svg>
  );
}

function StatTile({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <View className="flex-1 items-center rounded-2xl border border-line bg-surface py-4">
      <Text className="text-base">{icon}</Text>
      <Text
        className="font-display text-2xl text-ink mt-1"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {value}
      </Text>
      <Text className="font-body text-[11px] text-ink-dim mt-1 text-center">{label}</Text>
    </View>
  );
}

export default function Streak() {
  const [view, setView] = useState<StreakView | null>(null);

  useEffect(() => {
    api.streak().then(setView).catch(() => {});
  }, []);

  const kinds = new Map((view?.days ?? []).map((d) => [d.day, d.kind]));
  const current = view?.currentStreak ?? 0;
  const longest = view?.longestStreak ?? 0;
  const totalDone = view?.days?.length ?? 0;
  const week = lastNDays(7);

  const achievements: { icon: string; title: string; detail: string; done: boolean }[] = [
    { icon: "🌱", title: "First thing done", detail: "Finish 1 task", done: totalDone >= 1 },
    { icon: "🔥", title: "On a roll", detail: "3-day streak", done: longest >= 3 },
    { icon: "⚡", title: "Unstoppable", detail: "7-day streak", done: longest >= 7 },
    { icon: "🧊", title: "Rest, not reset", detail: "Bank a freeze", done: (view?.freezesAvailable ?? 0) >= 1 },
  ];
  const earned = achievements.filter((a) => a.done).length;

  return (
    <Screen scroll>
      <View className="flex-row items-center justify-between">
        <Pressable testID="streak-back" onPress={() => router.back()}>
          <Text className="font-body text-base text-ink-dim">← Back</Text>
        </Pressable>
        <Text className="font-body-semibold text-sm text-ink">Streak & Achievements</Text>
        <View style={{ width: 44 }} />
      </View>

      <View className="items-center mt-8" style={{ height: 220 }}>
        <Animated.View
          entering={ZoomIn.duration(550).springify()}
          className="items-center justify-center"
          style={{ width: 220, height: 220 }}
        >
          <FlameGlow />
          <Text className="text-4xl">🔥</Text>
          <Text
            testID="streak-current"
            className="font-display text-5xl text-ink mt-1"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {current}
          </Text>
          <Text className="font-body text-sm text-ink-dim mt-1">day streak</Text>
        </Animated.View>
      </View>
      <View className="items-center mt-1">
        <View className="flex-row items-center gap-2 rounded-full bg-primary/10 border border-primary/30 px-3.5 py-1.5">
          <View className="h-1.5 w-1.5 rounded-full bg-primary" />
          <Text className="font-body-semibold text-xs text-primary">
            {current > 0 ? "Amazing consistency!" : "Today is a great day to start"}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between mt-8 px-1">
        {week.map((day, i) => {
          const kind = kinds.get(day);
          const isToday = i === week.length - 1;
          const letter = DAY_LETTERS[new Date(`${day}T12:00:00Z`).getUTCDay()];
          return (
            <Animated.View
              key={day}
              entering={ZoomIn.delay(i * 45).springify()}
              className="items-center gap-2"
            >
              <Text className="font-body text-[11px] text-ink-dim">{letter}</Text>
              <View
                className={`h-10 w-10 items-center justify-center rounded-full ${
                  kind === "active"
                    ? "bg-primary"
                    : kind === "freeze"
                      ? "bg-freeze/70"
                      : isToday
                        ? "border-2 border-primary/60 bg-surface"
                        : "border border-line bg-surface"
                }`}
              >
                {kind === "active" ? (
                  <Text className="font-body-semibold text-sm text-on-primary">✓</Text>
                ) : kind === "freeze" ? (
                  <Text className="text-xs">🧊</Text>
                ) : null}
              </View>
            </Animated.View>
          );
        })}
      </View>

      <View className="flex-row gap-2.5 mt-8">
        {[
          { icon: "🔥", value: current, label: "Current streak" },
          { icon: "🏆", value: longest, label: "Best streak" },
          { icon: "✅", value: totalDone, label: "Days logged" },
        ].map((s, i) => (
          <Animated.View key={s.label} entering={FadeInUp.delay(i * 90).springify()} className="flex-1">
            <StatTile icon={s.icon} value={s.value} label={s.label} />
          </Animated.View>
        ))}
      </View>

      <View className="flex-row items-center justify-between mt-10">
        <Text className="font-body-semibold text-sm text-ink-dim uppercase tracking-widest">
          Achievements
        </Text>
        <Text className="font-body text-sm text-ink-dim">
          {earned}/{achievements.length}
        </Text>
      </View>
      <View className="flex-row flex-wrap mt-4" style={{ gap: 10 }}>
        {achievements.map((a, i) => (
          <Animated.View
            key={a.title}
            entering={(a.done ? ZoomIn : FadeInUp).delay(i * 80).springify()}
            className={`rounded-2xl border p-4 ${
              a.done ? "border-primary/40 bg-primary/10" : "border-line bg-surface"
            }`}
            style={{ width: "47.5%" }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-xl">{a.icon}</Text>
              {a.done ? (
                <Animated.View
                  entering={ZoomIn.delay(i * 80 + 200).springify()}
                  className="h-5 w-5 items-center justify-center rounded-full bg-primary"
                >
                  <Text className="font-body-semibold text-[10px] text-on-primary">✓</Text>
                </Animated.View>
              ) : null}
            </View>
            <Text className={`font-body-semibold text-sm mt-2 ${a.done ? "text-ink" : "text-ink-dim"}`}>
              {a.title}
            </Text>
            <Text className="font-body text-[11px] text-ink-dim mt-0.5">{a.detail}</Text>
          </Animated.View>
        ))}
      </View>

      <View className="mt-10">
        <Text className="font-body-semibold text-sm text-ink-dim uppercase tracking-widest">
          Last 5 weeks
        </Text>
        <View className="flex-row flex-wrap mt-4" style={{ gap: 8 }}>
          {lastNDays(35).map((day) => {
            const kind = kinds.get(day);
            return (
              <View
                key={day}
                className={`h-10 w-10 rounded-lg items-center justify-center ${
                  kind === "active"
                    ? "bg-primary/80"
                    : kind === "freeze"
                      ? "bg-freeze/60"
                      : "bg-surface border border-line"
                }`}
              >
                <Text
                  className={`font-body text-[10px] ${
                    kind === "active" ? "text-on-primary" : "text-ink-dim"
                  }`}
                >
                  {Number(day.slice(8, 10))}
                </Text>
              </View>
            );
          })}
        </View>
        <View className="flex-row items-center mt-6 self-start rounded-full bg-surface border border-line px-4 py-2">
          <Text className="font-body text-sm text-freeze">
            🧊 {view?.freezesAvailable ?? 0} freeze{(view?.freezesAvailable ?? 0) === 1 ? "" : "s"} banked
          </Text>
        </View>
        <Text className="font-body text-sm text-ink-dim mt-4 leading-5">
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
