import { useCallback, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Screen } from "../../src/components/ui/Screen";
import { Button } from "../../src/components/ui/Button";
import { api, type Task } from "../../src/lib/api";
import { prepareImage } from "../../src/lib/imagePrep";
import { useAppState } from "../../src/state/appState";

const ENERGY = [
  { level: 1, label: "Running on fumes" },
  { level: 2, label: "Meh" },
  { level: 3, label: "Actually okay" },
];

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
      <View className="flex-row items-center justify-between">
        <Pressable
          testID="home-streak"
          onPress={() => router.push("/(app)/streak")}
          className="flex-row items-center rounded-full bg-surface border border-line px-4 py-2"
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

      <Text className="font-display-medium text-3xl text-ink mt-10 leading-[44px]">
        What are you dreading?
      </Text>
      <TextInput
        testID="home-task-input"
        className="mt-5 rounded-2xl bg-surface border border-line px-5 py-5 font-body text-lg text-ink"
        placeholder="e.g. the dish mountain"
        placeholderTextColor="#9A9AB0"
        value={title}
        onChangeText={setTitle}
        onSubmitEditing={breakdown}
        returnKeyType="go"
      />

      <View className="flex-row gap-2 mt-4">
        {ENERGY.map((e) => (
          <Pressable
            key={e.level}
            testID={`home-energy-${e.level}`}
            onPress={() => setEnergy(e.level)}
            className={`rounded-full border px-4 py-2 ${
              energy === e.level ? "border-primary bg-primary/15" : "border-line bg-surface"
            }`}
          >
            <Text
              className={`font-body text-xs ${energy === e.level ? "text-primary" : "text-ink-dim"}`}
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
            return (
              <Pressable
                key={task.id}
                testID={`home-task-${task.id}`}
                onPress={() => router.push(`/(app)/task/${task.id}`)}
                className="mt-3 rounded-2xl bg-surface border border-line p-5"
              >
                <Text className="font-body-medium text-base text-ink">
                  {task.title}
                </Text>
                <Text className="font-body text-sm text-ink-dim mt-1">
                  {done}/{task.steps.length} steps done
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </Screen>
  );
}
