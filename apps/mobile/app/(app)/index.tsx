import { useCallback, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
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

// Rotating daily so the input always names a task she actually recognizes.
const EXAMPLE_DREADS = [
  "the permission slip that's been on the counter three days",
  "replying to the class group chat before it hits 200 messages",
  "packing tomorrow's lunches",
  "the unread school email with a deadline buried in it",
  "the school portal whose password you don't remember",
  "meal planning before the fridge is empty",
  "the kids' laundry pile that's basically furniture now",
  "RSVPing to the birthday party before it's too late",
  "the dentist appointment you've rescheduled twice",
  "the pile of art projects you can't toss or display",
];

function examplePlaceholder(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  return `e.g. ${EXAMPLE_DREADS[dayOfYear % EXAMPLE_DREADS.length]}`;
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
          className="flex-row items-center rounded-full bg-surface/20 border border-line/30 px-4 py-2"
        >
          <Text className="font-body-semibold text-base text-hype">
            🔥 {streak}
          </Text>
        </Pressable>
        <View className="flex-row gap-3">
          <Pressable
            testID="home-recap"
            onPress={() => router.push("/(app)/recap")}
            className="rounded-full bg-surface/15 border border-line/30 px-4 py-2"
          >
            <Text className="font-body text-base text-ink">📊</Text>
          </Pressable>
          <Pressable
            testID="home-settings"
            onPress={() => router.push("/(app)/settings")}
            className="rounded-full bg-surface/15 border border-line/30 px-4 py-2"
          >
            <Text className="font-body text-base text-ink">⚙️</Text>
          </Pressable>
        </View>
      </View>

      <Animated.View entering={FadeInDown.duration(420).springify()}>
        <Text className="font-body text-sm text-ink-dim mt-9">{greeting()}</Text>
        <Text className="font-display text-3xl text-ink mt-2 leading-[46px]">
          What are you{"\n"}
          <Text className="font-display-italic text-primary">dreading?</Text>
        </Text>
      </Animated.View>
      <View
        className="mt-6 rounded-2xl"
        style={{
          shadowColor: "#40060F",
          shadowOpacity: 0.3,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
          elevation: 5,
        }}
      >
        <TextInput
          testID="home-task-input"
          className="rounded-2xl bg-surface/15 border border-primary/40 px-5 py-5 font-body text-lg text-ink"
          placeholder={examplePlaceholder()}
          placeholderTextColor="#FFE3D9"
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={breakdown}
          returnKeyType="go"
        />
      </View>

      <View className="flex-row bg-surface/15 rounded-full p-1 mt-4">
        {ENERGY.map((e) => (
          <Pressable
            key={e.level}
            testID={`home-energy-${e.level}`}
            onPress={() => setEnergy(e.level)}
            className={`flex-1 items-center rounded-full py-2 ${
              energy === e.level ? "bg-ink" : ""
            }`}
          >
            <Text
              className={`font-body text-xs ${energy === e.level ? "text-berry font-body-semibold" : "text-ink-dim"}`}
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
          {inProgress.map((task, i) => {
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
              <Animated.View key={task.id} entering={FadeInUp.delay(i * 80).springify()}>
                <Pressable
                  testID={`home-task-${task.id}`}
                  onPress={() => router.push(`/(app)/task/${task.id}`)}
                  className="mt-3 flex-row items-center gap-4 rounded-2xl bg-surface/20 border border-line/30 p-4"
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
              </Animated.View>
            );
          })}
        </View>
      ) : null}
    </Screen>
  );
}
