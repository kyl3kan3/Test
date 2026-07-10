/**
 * "Bold sunset" design tokens — a full-bleed coral-to-magenta gradient world
 * with cream type, golden accents, and near-black ink CTAs. Loud, warm,
 * main-character energy. The page background is a gradient (painted by the
 * Screen component: #C63E44 -> #93294D -> #571A44); `bg` is its solid
 * fallback. Content surfaces are solid cream cards (`card`, with `cardInk`/
 * `cardDim` text) floated on warm shadows; dark translucent overlays
 * (`surface`/`surfaceRaised` at /15-/25) remain only for selection controls
 * in their unselected state, and `border` is cream used at ~/30.
 */
export const colors = {
  bg: "#93294D",
  surface: "#1D0F12",
  surfaceRaised: "#1D0F12",
  border: "#FFF6F0",
  primary: "#FFD9A0",
  primaryPressed: "#F2C384",
  hype: "#FFD9A0",
  success: "#FFF6F0",
  freeze: "#CDE9FF",
  danger: "#FFC9B3",
  text: "#FFF6F0",
  textDim: "#FFDCCF",
  textOnPrimary: "#3A1608",
  /** Deep magenta from the gradient's foot — labels on cream surfaces. */
  berry: "#C93A6B",
  /** Near-black warm ink — primary CTA fill. */
  cta: "#1D1210",
  /** Solid cream card surface — content sits on these, not on dark glass. */
  card: "#FFFBF5",
  /** Dark berry-ink body text on cream cards. */
  cardInk: "#3A1620",
  /** Muted rose secondary text on cream cards. */
  cardDim: "#B4737D",
  /** Saturated coral accent for rings/progress drawn on cream. */
  accent: "#E8484F",
} as const;

export const fonts = {
  body: "Nunito_400Regular",
  bodyMedium: "Nunito_600SemiBold",
  bodySemiBold: "Nunito_700Bold",
  display: "Fraunces_600SemiBold",
  displayMedium: "Fraunces_500Medium",
  displayItalic: "Fraunces_600SemiBold_Italic",
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

/** Gradient stops for the full-bleed sunset background. */
export const sunset = ["#C63E44", "#93294D", "#571A44"] as const;
