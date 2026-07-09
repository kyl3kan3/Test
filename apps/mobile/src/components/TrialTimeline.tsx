import { Text, View } from "react-native";

/**
 * Trial-transparency strip — tells users exactly when they'll be reminded
 * and charged. Counter-intuitive, CRO-proven: honesty lifts trial starts.
 */
const STEPS = [
  { label: "TODAY", copy: "Full access, first task slain" },
  { label: "DAY 2", copy: "We remind you the trial is ending" },
  { label: "DAY 3", copy: "Billing starts — or cancel in 2 taps" },
];

export function TrialTimeline() {
  return (
    <View testID="paywall-timeline" className="flex-row gap-2 mt-4">
      {STEPS.map((s) => (
        <View
          key={s.label}
          className="flex-1 rounded-xl border border-line/30 bg-surface/15 px-2.5 py-2.5"
        >
          <Text className="font-body-semibold text-[10px] tracking-widest text-primary">
            {s.label}
          </Text>
          <Text className="font-body text-[10px] leading-[14px] text-ink-dim mt-1">
            {s.copy}
          </Text>
        </View>
      ))}
    </View>
  );
}
