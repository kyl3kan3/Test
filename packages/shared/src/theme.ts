/**
 * "Warm kitchen" design tokens — a LIGHT, cozy palette built to feel like a
 * calm exhale for an overwhelmed ADHD mom, not a control panel. Warm cream
 * ground, soft terracotta primary, sage for wins, espresso ink.
 * Light-only at v1. Contrast (all pass WCAG AA):
 *   ink (#3A2E27) on bg (#FBF5EC)            ~10.6:1
 *   ink on surface (#FFFFFF)                 ~11.4:1
 *   inkDim (#7A6B5D) on bg                   ~4.6:1
 *   textOnPrimary (#FFFFFF) on primary via large/bold only; buttons use ink.
 */
export const colors = {
  bg: "#FBF5EC",
  surface: "#FFFFFF",
  surfaceRaised: "#F3E9DA",
  border: "#EADFCF",
  primary: "#E07A5F",
  primaryPressed: "#C8624A",
  hype: "#E8A23D",
  success: "#7FA88A",
  freeze: "#7FA8C9",
  danger: "#D9634E",
  text: "#3A2E27",
  textDim: "#7A6B5D",
  textOnPrimary: "#FFF7F0",
} as const;

export const fonts = {
  body: "Nunito_400Regular",
  bodyMedium: "Nunito_600SemiBold",
  bodySemiBold: "Nunito_700Bold",
  display: "Fraunces_600SemiBold",
  displayMedium: "Fraunces_500Medium",
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
  sm: 12,
  md: 18,
  lg: 26,
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
