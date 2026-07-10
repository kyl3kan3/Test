import "../global.css";
import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from "@expo-google-fonts/nunito";
import {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_600SemiBold_Italic,
} from "@expo-google-fonts/fraunces";
import { configurePurchases, getEntitlement, onEntitlementChange } from "../src/lib/purchases";
import { useAppState } from "../src/state/appState";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const setPro = useAppState((s) => s.setPro);
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_600SemiBold_Italic,
  });

  useEffect(() => {
    configurePurchases()
      .then(() => getEntitlement())
      .then((e) => setPro(e.isPro))
      .catch(() => {});
    return onEntitlementChange((e) => setPro(e.isPro));
  }, [setPro]);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: "#93294D" }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#93294D" },
          animation: "fade",
        }}
      />
    </SafeAreaProvider>
  );
}
