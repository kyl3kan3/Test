import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Screen } from "../../../src/components/ui/Screen";
import { Button } from "../../../src/components/ui/Button";
import { api, type Task } from "../../../src/lib/api";

export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [splitting, setSplitting] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (id) api.task(id).then(setTask).catch(() => {});
    }, [id]),
  );

  if (!task) return <Screen>{null}</Screen>;

  const remaining = task.steps.filter((s) => s.status === "todo");
  const allDone = remaining.length === 0;

  const split = async (stepId: string) => {
    setSplitting(stepId);
    try {
      const newTask = await api.breakdown({
        title: task.title,
        splitStepId: stepId,
      });
      router.replace(`/(app)/task/${newTask.id}`);
    } finally {
      setSplitting(null);
    }
  };

  return (
    <Screen scroll>
      <Pressable testID="task-back" onPress={() => router.back()}>
        <Text className="font-body text-base text-ink-dim">← Back</Text>
      </Pressable>

      <Animated.View entering={FadeInDown.duration(380).springify()}>
        <Text className="font-display-medium text-2xl text-ink mt-6 leading-9">
          {task.title}
        </Text>
        {task.vibeCheck ? (
          <View className="mt-4 rounded-2xl bg-primary/10 border border-primary/30 p-4">
            <Text testID="task-vibecheck" className="font-body text-sm text-ink leading-5">
              {task.vibeCheck}
            </Text>
          </View>
        ) : null}
        {task.observations && task.observations.length > 0 ? (
          <Text className="font-body text-xs text-ink-dim mt-3">
            Spotted: {task.observations.join(" · ")}
          </Text>
        ) : null}
      </Animated.View>

      <View className="mt-6">
        {task.steps.map((step, i) => (
          <Animated.View
            key={step.id}
            entering={FadeInUp.delay(i * 70).springify()}
            className={`mt-3 rounded-2xl border p-5 ${
              step.status === "done"
                ? "bg-success/10 border-success/30"
                : "bg-surface/15 border-line/30"
            }`}
          >
            <View className="flex-row items-center justify-between">
              <Text className="font-body text-xs text-ink-dim">
                {step.status === "done" ? "✓ done" : `~${Math.round(step.estimatedSeconds / 60) || 1} min`}
              </Text>
              {step.status === "todo" ? (
                <Text
                  testID={`step-split-${i}`}
                  className="font-body text-xs text-primary"
                  onPress={() => split(step.id)}
                >
                  {splitting === step.id ? "shrinking…" : "too big?"}
                </Text>
              ) : null}
            </View>
            <Text
              testID={`step-title-${i}`}
              className={`font-body-medium text-base mt-1 ${
                step.status === "done" ? "text-ink-dim line-through" : "text-ink"
              }`}
            >
              {i + 1}. {step.title}
            </Text>
            {step.detail && step.status !== "done" ? (
              <Text className="font-body text-sm text-ink-dim mt-1">{step.detail}</Text>
            ) : null}
          </Animated.View>
        ))}
      </View>

      <View className="mt-8">
        {allDone ? (
          <Button
            testID="task-celebrate"
            label="Celebrate 🎉"
            big
            onPress={() => router.push(`/(app)/celebrate/${task.id}`)}
          />
        ) : (
          <Button
            testID="task-start"
            label={`Just start (${Math.max(1, Math.round((remaining[0]?.estimatedSeconds ?? 120) / 60))} min)`}
            big
            onPress={() => router.push(`/(app)/session/${task.id}`)}
          />
        )}
      </View>
    </Screen>
  );
}
