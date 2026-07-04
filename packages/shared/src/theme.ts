/**
 * "Terracotta dusk" design tokens — warm near-black base with a glowing
 * coral accent (no purple, no neon-green biohacker vibe — warmer and
 * softer, built for the ADHD-mom audience). Dark-only at v1.
 * All text/surface pairs hold >= 4.5:1 contrast:
 *   text (#F8F1EA) on bg (#120D0B)          ~17.1:1
 *   text on surface (#1C1512)               ~14.6:1
 *   textDim (#A89A8D) on bg                 ~6.9:1
 *   textOnPrimary (#1A0F0A) on primary (#FF7A59) ~5.7:1
 */
export const colors = {
  bg: "#120D0B",
  surface: "#1C1512",
  surfaceRaised: "#251C17",
  border: "#3B2E26",
  primary: "#FF7A59",
  primaryPressed: "#E85F3F",
  hype: "#FFC24B",
  success: "#4ADE9E",
  freeze: "#7DD3FC",
  danger: "#FB7185",
  text: "#F8F1EA",
  textDim: "#A89A8D",
  textOnPrimary: "#1A0F0A",
} as const;

export const fonts = {
  body: "Lexend_400Regular",
  bodyMedium: "Lexend_500Medium",
  bodySemiBold: "Lexend_600SemiBold",
  display: "Unbounded_700Bold",
  displayMedium: "Unbounded_500Medium",
} as const;

export const typeScale = {
  display: 40,
  displaySmall: 34,
  title: 24,
  subtitle: 20,
  body: 17,
  caption: 13,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
