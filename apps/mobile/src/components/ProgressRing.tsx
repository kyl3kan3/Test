import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "@dtt/shared/theme";

/** Small completion ring for resumable task cards. */
export function ProgressRing({ done, total }: { done: number; total: number }) {
  const size = 38;
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? done / total : 0;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.surfaceRaised}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.success}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c * pct} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text className="font-body-semibold text-[9px] text-ink-dim">
        {Math.round(pct * 100)}%
      </Text>
    </View>
  );
}
