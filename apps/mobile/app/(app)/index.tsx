import { useCallback, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Screen } from "../../src/components/ui/Screen";
import { Button } from "../../src/components/ui/Button";
import { Aurora } from "../../src/components/Aurora";
import { ProgressRing } from "../../src/components/ProgressRing";
import { api, type Task } from "../../src/lib/api";
import { prepareImage } from "../../src/lib/imagePrep";
import { useAppState } from "../../src/state/appState";

const ENERGY = [
  { level: 1, label: "Running on fumes" },
  { level: 2, label: "Meh" },
  { level: 3, label: "Actually okay" },
];

function greeting(): string {
  const day = new Date().toLocaleDateString(undefined, { weekday: "long" });
  const h = new Date().getHours();
  const part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  return `${day} ${part}`;
}

export default function Home() {
  const me = useAppState((s) => s.me);
  const [title, setTitle] = useState("");
  const [energy, setEnergy] = useState(2);
  const [busy, setBusy] = useState<"text" | "photo" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inProgress, setInProgress] = useState<Task[]>([]);
  const [streak, setStreak] = useState(me?.streak.currentStreak ?? 0);

  useFocusEffect(
    useCallback(() => {
      api
        .tasks("in_progress")
        .then(setInProgress)
        .catch(() => {});
      api
        .me()
        .then((m) => setStreak(m.streak.currentStreak))
        .catch(() => {});
    }, []),
  );

  const breakdown = async () => {
    if (!title.trim()) return;
    setBusy("text");
    setError(null);
    try {
      const task = await api.breakdown({ title: title.trim(), energyLevel: energy });
      setTitle("");
      router.push(`/(app)/task/${task.id}`);
    } catch (e: any) {
      setError(
        e?.status === 429
          ? "The coach needs a breather — you've hit today's limit. Back tomorrow!"
          : "Something hiccuped. One more try?",
      );
    } finally {
      setBusy(null);
    }
  };

  const photoPlan = async () => {
    setBusy("photo");
    setError(null);
    try {
      const ImagePicker = await import("expo-image-picker");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        quality: 1,
      });
      const asset = result.assets?.[0];
      if (result.canceled || !asset) {
        setBusy(null);
        return;
      }
      const { base64 } = await prepareImage(asset.uri, asset.width, asset.height);
      const task = await api.photoPlan({
        imageBase64: base64,
        mimeType: "image/jpeg",
        energyLevel: energy,
      });
      router.push(`/(app)/task/${task.id}`);
    } catch {
      setError("Couldn't read that photo. Try another one?");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen scroll>
      <Aurora />
      <View className="flex-row items-center justify-between">
        <Pressable
          testID="home-streak"
          onPress={() => router.push("/(app)/streak")}
          className="flex-row items-center rounded-full bg-surface/80 border border-line px-4 py-2"
        >
          <Text className="font-body-semibold text-base text-hype">
            🔥 {streak}
          </Text>
        </Pressable>
        <View className="flex-row gap-3">
          <Pressable
            testID="home-recap"
            onPress={() => router.push("/(app)/recap")}
            className="rounded-full bg-surface border border-line px-4 py-2"
          >
            <Text className="font-body text-base text-ink">📊</Text>
          </Pressable>
          <Pressable
            testID="home-settings"
            onPress={() => router.push("/(app)/settings")}
            className="rounded-full bg-surface border border-line px-4 py-2"
          >
            <Text className="font-body text-base text-ink">⚙️</Text>
          </Pressable>
        </View>
      </View>

      <Text className="font-body text-sm text-ink-dim mt-9">{greeting()}</Text>
      <Text className="font-display text-3xl text-ink mt-2 leading-[46px]">
        What are you{"\n"}
        <Text className="text-primary">dreading?</Text>
      </Text>
      <View
        className="mt-6 rounded-2xl"
        style={{
          shadowColor: "#3BE38B",
          shadowOpacity: 0.35,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 0 },
          elevation: 6,
        }}
      >
        <TextInput
          testID="home-task-input"
          className="rounded-2xl bg-surface/90 border border-primary/50 px-5 py-5 font-body text-lg text-ink"
          placeholder="e.g. the dish mountain"
          placeholderTextColor="#90A79A"
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={breakdown}
          returnKeyType="go"
        />
      </View>

      <View className="flex-row bg-surface border border-line rounded-full p-1 mt-4">
        {ENERGY.map((e) => (
          <Pressable
            key={e.level}
            testID={`home-energy-${e.level}`}
            onPress={() => setEnergy(e.level)}
            className={`flex-1 items-center rounded-full py-2 ${
              energy === e.level ? "bg-primary/25 border border-primary/50" : ""
            }`}
          >
            <Text
              className={`font-body text-xs ${energy === e.level ? "text-ink font-body-semibold" : "text-ink-dim"}`}
            >
              {e.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="mt-5 gap-3">
        <Button
          testID="home-breakdown"
          label="Break it down"
          big
          loading={busy === "text"}
          disabled={!title.trim() || busy !== null}
          onPress={breakdown}
        />
        <Button
          testID="home-photo"
          label="📸 Photo of the mess"
          variant="surface"
          loading={busy === "photo"}
          disabled={busy !== null}
          onPress={photoPlan}
        />
      </View>
      {error ? (
        <Text testID="home-error" className="font-body text-sm text-danger mt-4">
          {error}
        </Text>
      ) : null}

      {inProgress.length > 0 ? (
        <View className="mt-10">
          <Text className="font-body-semibold text-sm text-ink-dim uppercase tracking-widest">
            Pick back up
          </Text>
          {inProgress.map((task) => {
            const done = task.steps.filter((s) => s.status === "done").length;
            const left = task.steps.length - done;
            const mins = Math.max(
              1,
              Math.round(
                task.steps
                  .filter((s) => s.status === "todo")
                  .reduce((a, s) => a + s.estimatedSeconds, 0) / 60,
              ),
            );
            return (
              <Pressable
                key={task.id}
                testID={`home-task-${task.id}`}
                onPress={() => router.push(`/(app)/task/${task.id}`)}
                className="mt-3 flex-row items-center gap-4 rounded-2xl bg-surface/90 border border-line p-4"
              >
                <ProgressRing done={done} total={task.steps.length} />
                <View className="flex-1">
                  <Text className="font-body-medium text-base text-ink">
                    {task.title}
                  </Text>
                  <Text className="font-body text-xs text-ink-dim mt-0.5">
                    {left} tiny step{left === 1 ? "" : "s"} left · ~{mins} min
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </Screen>
  );
}
