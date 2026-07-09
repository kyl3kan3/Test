import { useEffect } from "react";
import { Text, View } from "react-native";
import Svg, { Line } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { colors } from "@dtt/shared/theme";
import { durations } from "../lib/motion";

const SIZE = 188;
const TICKS = 48;
const TICK_LEN = 10;
const INNER = SIZE - 40;
const GLOW = SIZE - 30;

/**
 * Radial tick gauge around the count-up timer: a ring of dashes that light
 * up coral as the step progresses toward its estimate, over a slow breathing
 * glow (6s box-breathing cadence — calm by entrainment, not decoration).
 */
function TickRing({ progress }: { progress: number }) {
  const cx = SIZE / 2;
  const outer = SIZE / 2 - 2;
  const lit = Math.round(Math.min(1, Math.max(0, progress)) * TICKS);
  return (
    <Svg width={SIZE} height={SIZE} style={{ position: "absolute", top: 0, left: 0 }}>
      {Array.from({ length: TICKS }, (_, i) => {
        // Start at 12 o'clock, sweep clockwise.
        const a = (i / TICKS) * Math.PI * 2 - Math.PI / 2;
        const x1 = cx + Math.cos(a) * (outer - TICK_LEN);
        const y1 = cx + Math.sin(a) * (outer - TICK_LEN);
        const x2 = cx + Math.cos(a) * outer;
        const y2 = cx + Math.sin(a) * outer;
        const on = i < lit;
        return (
          <Line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={on ? colors.primary : colors.border}
            strokeWidth={3}
            strokeLinecap="round"
            opacity={on ? 0.6 + 0.4 * ((i + 1) / Math.max(1, lit)) : 0.3}
          />
        );
      })}
    </Svg>
  );
}

function BreathGlow() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: durations.breath, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [t]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.94 + t.value * 0.1 }],
    opacity: 0.35 + t.value * 0.45,
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: (SIZE - GLOW) / 2,
          left: (SIZE - GLOW) / 2,
          width: GLOW,
          height: GLOW,
          borderRadius: GLOW / 2,
          backgroundColor: "rgba(255,217,160,0.07)",
          borderWidth: 1.5,
          borderColor: "rgba(255,217,160,0.35)",
        },
        style,
      ]}
    />
  );
}

export function BreathingOrbit({
  seconds,
  past,
  progress = 0,
  label,
}: {
  seconds: number;
  past: boolean;
  progress?: number;
  label?: string;
}) {
  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, "0");
  return (
    <View
      className="items-center justify-center self-center"
      style={{ width: SIZE, height: SIZE }}
    >
      <TickRing progress={past ? 1 : progress} />
      <BreathGlow />
      <View
        className="items-center justify-center bg-surface/25"
        style={{
          width: INNER,
          height: INNER,
          borderRadius: INNER / 2,
          shadowColor: "#40060F",
          shadowOpacity: 0.35,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        }}
      >
        <Text
          testID="session-timer"
          className={`font-display text-4xl ${past ? "text-ink-dim" : "text-ink"}`}
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {mm}:{ss}
        </Text>
        {label ? (
          <Text className="font-body text-[11px] text-ink-dim mt-1.5 text-center px-4">
            {label}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
