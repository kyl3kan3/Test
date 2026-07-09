import { useEffect, useRef, useState } from "react";
import { Platform, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeInUp, ZoomIn } from "react-native-reanimated";
import { Screen } from "../../../src/components/ui/Screen";
import { Button } from "../../../src/components/ui/Button";
import { Confetti } from "../../../src/components/Confetti";
import { ShareCard } from "../../../src/components/ShareCard";
import { api, type Task } from "../../../src/lib/api";
import { haptics } from "../../../src/lib/haptics";

export default function Celebrate() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [streak, setStreak] = useState(0);
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    haptics.celebrate();
    if (taskId) api.task(taskId).then(setTask).catch(() => {});
    api
      .streak()
      .then((s) => setStreak(s.currentStreak))
      .catch(() => {});
  }, [taskId]);

  const doneSteps = task?.steps.filter((s) => s.status === "done").length ?? 0;
  const minutes = Math.max(
    1,
    Math.round(
      (task?.steps
        .filter((s) => s.status === "done")
        .reduce((acc, s) => acc + s.estimatedSeconds, 0) ?? 60) / 60,
    ),
  );

  const share = async () => {
    if (!task) return;
    setSharing(true);
    try {
      const card = await api
        .logCard({ taskId: task.id, cardType: "task_slayed" })
        .catch(() => null);

      if (Platform.OS !== "web") {
        const { captureRef } = await import("react-native-view-shot");
        const Sharing = await import("expo-sharing");
        const uri = await captureRef(cardRef, {
          format: "png",
          quality: 1,
          width: 1080,
          height: 1920,
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: "image/png" });
          if (card) await api.markCardShared(card.id).catch(() => {});
        }
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <Screen>
      <Confetti />
      <View className="flex-1 justify-center">
        <Animated.View entering={FadeInUp.springify()}>
          <Text className="font-body-semibold text-xs text-hype uppercase tracking-widest">
            Screenshot this for the group chat
          </Text>
          <Animated.View entering={ZoomIn.duration(500).springify()}>
            <Text
              testID="celebrate-headline"
              className="font-display text-6xl text-ink mt-3 leading-[62px]"
            >
              You did{"\n"}
              <Text className="text-hype">the thing.</Text>
            </Text>
          </Animated.View>
          {task ? (
            <Text className="font-body text-lg text-ink-dim mt-4">“{task.title}”</Text>
          ) : null}
          <View className="flex-row gap-2.5 mt-8">
            <Animated.View
              entering={ZoomIn.delay(150).springify()}
              className="flex-1 items-center rounded-2xl bg-surface/90 border border-line px-2 py-4"
            >
              <Text
                className="font-display text-2xl text-hype"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {doneSteps}
              </Text>
              <Text className="font-body text-[11px] text-ink-dim mt-1">steps slain</Text>
            </Animated.View>
            <Animated.View
              entering={ZoomIn.delay(250).springify()}
              className="flex-1 items-center rounded-2xl bg-surface/90 border border-line px-2 py-4"
            >
              <Text
                className="font-display text-2xl text-hype"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {minutes}m
              </Text>
              <Text className="font-body text-[11px] text-ink-dim mt-1">of doing</Text>
            </Animated.View>
            <Animated.View
              entering={ZoomIn.delay(350).springify()}
              className="flex-1 items-center rounded-2xl bg-surface/90 border border-line px-2 py-4"
            >
              <Text testID="celebrate-streak" className="font-display text-2xl text-hype">
                🔥 {streak}
              </Text>
              <Text className="font-body text-[11px] text-ink-dim mt-1">day streak</Text>
            </Animated.View>
          </View>
        </Animated.View>
      </View>

      <View className="gap-3 pb-2">
        <Button
          testID="celebrate-share"
          label="Share the win"
          big
          loading={sharing}
          onPress={share}
        />
        <Button
          testID="celebrate-home"
          label="Back home"
          variant="surface"
          onPress={() => router.replace("/(app)")}
        />
      </View>

      {/* Offscreen 9:16 card for capture */}
      <View style={{ position: "absolute", left: -4000, top: 0 }} pointerEvents="none">
        <ShareCard
          ref={cardRef}
          data={{
            variant: "task_slayed",
            // The task IS the headline — funnier and more shareable than stats.
            headline: task ? `${task.title}: done.` : "I did the thing.",
            taskTitle: task
              ? `${doneSteps} comically small steps · ${minutes} minutes`
              : undefined,
            stats: [
              { label: "day streak", value: `🔥 ${streak}` },
              { label: "steps slain", value: String(doneSteps) },
            ],
          }}
        />
      </View>
    </Screen>
  );
}
