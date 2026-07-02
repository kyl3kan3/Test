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
    backgroundColor: "#0D0D14",
    justifyContent: "space-between",
    padding: 96,
  },
  inner: { flex: 1, justifyContent: "center" },
  kicker: {
    fontFamily: "Lexend_600SemiBold",
    fontSize: 40,
    letterSpacing: 12,
    color: "#8B7CFF",
  },
  headline: {
    fontFamily: "Unbounded_700Bold",
    fontSize: 120,
    lineHeight: 144,
    color: "#F4F4F8",
    marginTop: 48,
  },
  task: {
    fontFamily: "Lexend_400Regular",
    fontSize: 52,
    color: "#9A9AB0",
    marginTop: 48,
  },
  statsRow: { flexDirection: "row", gap: 64, marginTop: 96 },
  stat: {
    backgroundColor: "#171723",
    borderColor: "#2A2A3D",
    borderWidth: 2,
    borderRadius: 32,
    paddingVertical: 40,
    paddingHorizontal: 48,
  },
  statValue: {
    fontFamily: "Unbounded_700Bold",
    fontSize: 72,
    color: "#FF7A59",
  },
  statLabel: {
    fontFamily: "Lexend_400Regular",
    fontSize: 32,
    color: "#9A9AB0",
    marginTop: 12,
  },
  watermark: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 2,
    borderTopColor: "#2A2A3D",
    paddingTop: 48,
  },
  wordmark: {
    fontFamily: "Unbounded_500Medium",
    fontSize: 44,
    color: "#F4F4F8",
  },
  url: {
    fontFamily: "Lexend_400Regular",
    fontSize: 36,
    color: "#9A9AB0",
  },
});
