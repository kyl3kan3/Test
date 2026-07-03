/**
 * "Night garden" design tokens — deep forest-green base with a glowing mint
 * accent (PepKit-style premium health-tracker look). Dark-only at v1.
 * All text/surface pairs hold >= 4.5:1 contrast:
 *   text (#F1F7F2) on bg (#070B09)        ~19.4:1
 *   text on surface (#0F1712)             ~17.5:1
 *   textDim (#90A79A) on bg               ~7.6:1
 *   bg text (#04120A) on primary (#3BE38B) ~11.9:1
 */
export const colors = {
  bg: "#070B09",
  surface: "#0F1712",
  surfaceRaised: "#16221B",
  border: "#22322A",
  primary: "#3BE38B",
  primaryPressed: "#2BBD6E",
  hype: "#FFC24B",
  success: "#4ADE9E",
  freeze: "#7DD3FC",
  danger: "#FB7185",
  text: "#F1F7F2",
  textDim: "#90A79A",
  textOnPrimary: "#04120A",
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
