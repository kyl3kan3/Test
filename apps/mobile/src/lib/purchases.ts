import { Platform } from "react-native";
import { IS_E2E, RC_ANDROID_KEY, RC_IOS_KEY } from "./env";

/**
 * RevenueCat wrapper. On web builds and E2E runs this swaps to a stub
 * (react-native-purchases has no web implementation). The paywall UI itself
 * decides native vs stub rendering via `purchasesAvailable`.
 */

export type EntitlementState = {
  isPro: boolean;
  productId: string | null;
};

export const purchasesAvailable = Platform.OS !== "web" && !IS_E2E;

type Listener = (state: EntitlementState) => void;
const listeners = new Set<Listener>();

// E2E/web stub state — flipped by the stub "purchase".
let stubState: EntitlementState = { isPro: false, productId: null };

function emit(state: EntitlementState) {
  for (const l of listeners) l(state);
}

function entitlementFromCustomerInfo(info: any): EntitlementState {
  const ent = info?.entitlements?.active?.["pro"];
  return { isPro: Boolean(ent), productId: ent?.productIdentifier ?? null };
}

export async function configurePurchases(): Promise<void> {
  if (!purchasesAvailable) return;
  const Purchases = require("react-native-purchases").default;
  const apiKey = Platform.OS === "ios" ? RC_IOS_KEY : RC_ANDROID_KEY;
  if (!apiKey) {
    console.warn("RevenueCat key missing for", Platform.OS);
    return;
  }
  Purchases.configure({ apiKey });
  Purchases.addCustomerInfoUpdateListener((info: any) => {
    emit(entitlementFromCustomerInfo(info));
  });
}

/** Alias the RC user to our auth user id. Call right after sign-in. */
export async function logInPurchases(userId: string): Promise<void> {
  if (!purchasesAvailable) return;
  const Purchases = require("react-native-purchases").default;
  await Purchases.logIn(userId);
}

export async function getEntitlement(): Promise<EntitlementState> {
  if (!purchasesAvailable) return stubState;
  const Purchases = require("react-native-purchases").default;
  const info = await Purchases.getCustomerInfo();
  return entitlementFromCustomerInfo(info);
}

/** Present the remote paywall; resolves true if pro is active afterwards. */
export async function presentPaywall(): Promise<boolean> {
  if (!purchasesAvailable) {
    // Stub purchase for web/e2e flows.
    stubState = { isPro: true, productId: "pro_yearly" };
    emit(stubState);
    return true;
  }
  const RevenueCatUI = require("react-native-purchases-ui").default;
  const Purchases = require("react-native-purchases").default;
  await RevenueCatUI.presentPaywall();
  const info = await Purchases.getCustomerInfo();
  const state = entitlementFromCustomerInfo(info);
  emit(state);
  return state.isPro;
}

export async function restorePurchases(): Promise<boolean> {
  if (!purchasesAvailable) return stubState.isPro;
  const Purchases = require("react-native-purchases").default;
  const info = await Purchases.restorePurchases();
  const state = entitlementFromCustomerInfo(info);
  emit(state);
  return state.isPro;
}

export function onEntitlementChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Test hook: reset the stub between e2e scenarios. */
export function __resetStubForTests(): void {
  stubState = { isPro: false, productId: null };
}
