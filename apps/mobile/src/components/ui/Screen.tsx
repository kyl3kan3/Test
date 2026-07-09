import { ReactNode } from "react";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { sunset } from "@dtt/shared/theme";

/**
 * Every screen sits on the full-bleed sunset gradient. `bg` in the theme is
 * only the solid fallback painted behind it during transitions.
 */
export function Screen({
  children,
  scroll = false,
  padded = true,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
}) {
  const insets = useSafeAreaInsets();
  const base: ViewStyle = {
    flex: 1,
    paddingTop: insets.top + 8,
    paddingBottom: insets.bottom + 8,
  };
  return (
    <View className="flex-1 bg-bg">
      <LinearGradient
        colors={[...sunset]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.75, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={padded ? "px-5 pb-10" : "pb-10"}
          style={[base, style]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View className={`flex-1 ${padded ? "px-5" : ""}`} style={[base, style]}>
          {children}
        </View>
      )}
    </View>
  );
}
