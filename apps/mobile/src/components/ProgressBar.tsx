import { View } from "react-native";

export function ProgressBar({ progress }: { progress: number }) {
  return (
    <View className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
      <View
        className="h-full rounded-full bg-primary"
        style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }}
      />
    </View>
  );
}
