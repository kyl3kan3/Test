import { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";

/**
 * 9:16 share card rendered offscreen at 1080x1920 logical px and captured
 * with react-native-view-shot. Plain StyleSheet on purpose: pixel-exact
 * layout for the exported image, independent of app styling.
 */

export type ShareCardData = {
  variant: "task_slayed" | "streak";
  headline: string;
  taskTitle?: string;
  stats: { label: string; value: string }[];
};

export const ShareCard = forwardRef<View, { data: ShareCardData }>(
  function ShareCard({ data }, ref) {
    return (
      <View ref={ref} collapsable={false} style={styles.card}>
        <View style={styles.inner}>
          <Text style={styles.kicker}>
            {data.variant === "streak" ? "STREAK ALERT" : "I DID THE THING"}
          </Text>
          <Text style={styles.headline}>{data.headline}</Text>
          {data.taskTitle ? (
            <Text style={styles.task}>“{data.taskTitle}”</Text>
          ) : null}
          <View style={styles.statsRow}>
            {data.stats.map((s) => (
              <View key={s.label} style={styles.stat}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.watermark}>
          <Text style={styles.wordmark}>⚡ DoTheThing</Text>
          <Text style={styles.url}>dothething.app</Text>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    width: 1080,
    height: 1920,
    backgroundColor: "#FBF5EC",
    justifyContent: "space-between",
    padding: 96,
  },
  inner: { flex: 1, justifyContent: "center" },
  kicker: {
    fontFamily: "Nunito_700Bold",
    fontSize: 40,
    letterSpacing: 12,
    color: "#C8624A",
  },
  headline: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 116,
    lineHeight: 132,
    color: "#3A2E27",
    marginTop: 48,
  },
  task: {
    fontFamily: "Nunito_400Regular",
    fontSize: 52,
    color: "#7A6B5D",
    marginTop: 48,
  },
  statsRow: { flexDirection: "row", gap: 64, marginTop: 96 },
  stat: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EADFCF",
    borderWidth: 2,
    borderRadius: 40,
    paddingVertical: 40,
    paddingHorizontal: 48,
  },
  statValue: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 72,
    color: "#E07A5F",
  },
  statLabel: {
    fontFamily: "Nunito_400Regular",
    fontSize: 32,
    color: "#7A6B5D",
    marginTop: 12,
  },
  watermark: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 2,
    borderTopColor: "#EADFCF",
    paddingTop: 48,
  },
  wordmark: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 44,
    color: "#3A2E27",
  },
  url: {
    fontFamily: "Nunito_400Regular",
    fontSize: 36,
    color: "#7A6B5D",
  },
});
