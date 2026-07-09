import { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { sunset } from "@dtt/shared/theme";

/**
 * 9:16 share card rendered offscreen at 1080x1920 logical px and captured
 * with react-native-view-shot. Plain StyleSheet on purpose: pixel-exact
 * layout for the exported image, independent of app styling. Painted on the
 * same full-bleed sunset gradient as the app itself — the share card IS the
 * brand.
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
        <LinearGradient
          colors={[...sunset]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.75, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
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
    backgroundColor: "#F04E56",
    justifyContent: "space-between",
    padding: 96,
  },
  inner: { flex: 1, justifyContent: "center" },
  kicker: {
    fontFamily: "Nunito_700Bold",
    fontSize: 40,
    letterSpacing: 12,
    color: "#FFD9A0",
  },
  headline: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 116,
    lineHeight: 132,
    color: "#FFF6F0",
    marginTop: 48,
  },
  task: {
    fontFamily: "Nunito_400Regular",
    fontSize: 52,
    color: "rgba(255,246,240,0.8)",
    marginTop: 48,
  },
  statsRow: { flexDirection: "row", gap: 64, marginTop: 96 },
  stat: {
    backgroundColor: "rgba(0,0,0,0.22)",
    borderRadius: 40,
    paddingVertical: 40,
    paddingHorizontal: 48,
  },
  statValue: {
    fontFamily: "Fraunces_600SemiBold",
    fontSize: 72,
    color: "#FFD9A0",
  },
  statLabel: {
    fontFamily: "Nunito_400Regular",
    fontSize: 32,
    color: "rgba(255,246,240,0.75)",
    marginTop: 12,
  },
  watermark: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 2,
    borderTopColor: "rgba(255,246,240,0.35)",
    paddingTop: 48,
  },
  wordmark: {
    fontFamily: "Fraunces_500Medium",
    fontSize: 44,
    color: "#FFF6F0",
  },
  url: {
    fontFamily: "Nunito_400Regular",
    fontSize: 36,
    color: "rgba(255,246,240,0.75)",
  },
});
