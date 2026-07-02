import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useKeepAwake } from "expo-keep-awake";
import { Screen } from "../../../src/components/ui/Screen";
import { Button } from "../../../src/components/ui/Button";
import { Timer } from "../../../src/components/Timer";
import { Aurora } from "../../../src/components/Aurora";
import { api, type Task } from "../../../src/lib/api";
import { haptics } from "../../../src/lib/haptics";
import { useCoachChat } from "../../../src/hooks/useCoachChat";

export default function FocusSession() {
  useKeepAwake();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [paused, setPaused] = useState(false);
  const [draft, setDraft] = useState("");
  const startedRef = useRef(false);

  const steps = useMemo(
    () => (task?.steps ?? []).filter((s) => s.status !== "skipped"),
    [task],
  );
  const currentStep = steps.filter((s) => s.status === "todo")[0] ?? null;
  const stepCount = steps.length;

  const chat = useCoachChat(() => ({
    taskId: taskId ?? "",
    taskTitle: task?.title ?? "",
    stepTitle: currentStep?.title ?? "",
    stepIndex,
    stepCount: Math.max(1, stepCount),
    secondsElapsed: seconds,
  }));
  const chatRef = useRef(chat);
  chatRef.current = chat;

  // Load task + open the session once.
  useEffect(() => {
    if (!taskId || startedRef.current) return;
    startedRef.current = true;
    (async () => {
      const t = await api.task(taskId);
      setTask(t);
      const s = await api.startSession(taskId);
      setSessionId(s.id);
      chatRef.current.sendMessage({ text: "[event:session_started]" });
    })().catch(() => {});
  }, [taskId]);

  // Tick the step timer.
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setSeconds((s) => s + 1);
      setTotalSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [paused]);

  // Gentle idle nudge at 60s of step inactivity.
  const nudgedRef = useRef(false);
  useEffect(() => {
    if (seconds === 60 && !nudgedRef.current) {
      nudgedRef.current = true;
      chatRef.current.sendMessage({ text: "[event:idle_60s]" });
    }
  }, [seconds]);

  const lastAssistantText = useMemo(() => {
    const assistant = [...chat.messages].reverse().find((m) => m.role === "assistant");
    if (!assistant) return "Let's go. Step one is tiny on purpose.";
    return assistant.parts
      .map((p: any) => (p.type === "text" ? p.text : ""))
      .join("")
      .trim();
  }, [chat.messages]);

  if (!task || !currentStep) {
    // All steps already done -> straight to celebration.
    if (task && !currentStep) {
      router.replace(`/(app)/celebrate/${task.id}`);
    }
    return <Screen>{null}</Screen>;
  }

  const completeStep = async () => {
    haptics.stepDone();
    await api.patchStep(currentStep.id, "done").catch(() => {});
    const newDone = doneCount + 1;
    setDoneCount(newDone);
    setSeconds(0);
    nudgedRef.current = false;

    const remaining = steps.filter((s) => s.status === "todo").length - 1;
    if (remaining <= 0) {
      haptics.celebrate();
      if (sessionId) {
        await api
          .endSession(sessionId, {
            stepsCompleted: newDone,
            durationSeconds: totalSeconds,
          })
          .catch(() => {});
      }
      await api.patchTask(task.id, "done").catch(() => {});
      router.replace(`/(app)/celebrate/${task.id}`);
      return;
    }
    chat.sendMessage({ text: "[event:step_completed]" });
    setStepIndex((i) => i + 1);
    const t = await api.task(task.id);
    setTask(t);
  };

  const splitStep = async () => {
    const newTask = await api.breakdown({
      title: task.title,
      splitStepId: currentStep.id,
    });
    if (sessionId) {
      await api
        .endSession(sessionId, { stepsCompleted: doneCount, durationSeconds: totalSeconds })
        .catch(() => {});
    }
    router.replace(`/(app)/task/${newTask.id}`);
  };

  const bail = async () => {
    if (sessionId) {
      await api
        .endSession(sessionId, { stepsCompleted: doneCount, durationSeconds: totalSeconds })
        .catch(() => {});
    }
    router.back();
  };

  const say = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    chat.sendMessage({ text });
  };

  return (
    <Screen>
      <Aurora />

      <View className="flex-row items-center justify-between">
        <Pressable testID="session-bail" onPress={bail}>
          <Text className="font-body text-base text-ink-dim">Save & exit</Text>
        </Pressable>
        <Text className="font-body text-xs tracking-widest uppercase text-ink-dim">
          step {Math.min(doneCount + 1, stepCount)} of {stepCount}
        </Text>
      </View>

      <View className="flex-1 items-center justify-center">
        <Text
          testID="session-step-title"
          className="font-display text-3xl text-ink text-center leading-[44px] px-2"
        >
          {currentStep.title}
        </Text>
        {currentStep.detail ? (
          <Text className="font-body text-base text-ink-dim text-center mt-3 px-4">
            {currentStep.detail}
          </Text>
        ) : null}
        <View className="mt-8">
          <Timer seconds={seconds} estimatedSeconds={currentStep.estimatedSeconds} />
        </View>
        <View className="flex-row gap-1.5 mt-6">
          {steps.map((s, i) => (
            <View
              key={s.id}
              className={`h-1 w-6 rounded-full ${
                s.status === "done"
                  ? "bg-success"
                  : i === steps.findIndex((x) => x.status === "todo")
                    ? "bg-primary"
                    : "bg-raised"
              }`}
            />
          ))}
        </View>
      </View>

      <View className="rounded-2xl border border-primary/40 bg-surface/90 p-4 mb-4">
        <View className="flex-row items-center gap-2 mb-1.5">
          <View className="h-1.5 w-1.5 rounded-full bg-success" />
          <Text className="font-body-semibold text-[10px] tracking-widest uppercase text-primary">
            Coach · live
          </Text>
        </View>
        <Text testID="coach-line" className="font-body text-sm text-ink leading-5">
          {lastAssistantText}
        </Text>
        <View className="flex-row items-center mt-3 gap-2">
          <TextInput
            testID="coach-input"
            className="flex-1 rounded-xl bg-raised border border-line px-4 py-2.5 font-body text-sm text-ink"
            placeholder="I'm stuck / this is boring / help"
            placeholderTextColor="#9A9AB0"
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={say}
            returnKeyType="send"
          />
          <Pressable
            testID="coach-send"
            onPress={say}
            className="rounded-xl bg-primary px-4 py-2.5"
          >
            <Text className="font-body-semibold text-sm text-on-primary">Send</Text>
          </Pressable>
        </View>
      </View>

      <View className="gap-3 pb-2">
        <Button
          testID="session-done"
          label="Done ✓"
          variant="success"
          big
          onPress={completeStep}
        />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              testID="session-split"
              label="Too big — split it"
              variant="surface"
              onPress={splitStep}
            />
          </View>
          <View className="flex-1">
            <Button
              testID="session-pause"
              label={paused ? "Resume" : "Pause"}
              variant="surface"
              onPress={() => setPaused((p) => !p)}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}
