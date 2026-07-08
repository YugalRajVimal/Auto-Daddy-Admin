export const colors = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primaryMutedBg: "#EAF2FF",
  primaryBlue900: "#1E3A8A",
  success: "#16A34A",
  successMuted: "#DCFCE7",
  successDark: "#166534",
  warning: "#F59E0B",
  warningMuted: "#FEF3C7",
  purple: "#7C3AED",
  bg: "#F4F7FD",
  bgAlt: "#EEF4FF",
  bgDeals: "#F0F6FF",
  bgProfile: "#F3F7FD",
  white: "#FFFFFF",
  text: "#0F172A",
  textMuted: "#64748B",
  textLight: "#94A3B8",
  pillPurple: "#EDE9FE",
  border: "#DCE6F6",
  danger: "#EF4444",
  dangerMuted: "#FEE2E2",
  orangeAccent: "#F97316",
  avatarGreen: "#22C55E",
  segmentBg: "#EEF4FF",
  trackBg: "#DCE6F6",
  switchTrackOff: "#CBD5E1",
  switchThumbOff: "#F8FAFF",
  switchTrackOn: "#86EFAC",
  tabInactive: "#94A3B8",
  tabBarBg: "#E0EDFF",
  tabBarBorder: "#C3DAFF",
  iconBlueTint: "#DBEAFE",
  overlayWhite: "rgba(255,255,255,0.95)",
  overlayWhiteSoft: "rgba(255,255,255,0.9)",
  overlayWhiteMuted: "rgba(255,255,255,0.85)",
  overlayWhiteBox: "rgba(255,255,255,0.25)",
} as const;

export const shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 8,
  },
  soft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 6,
  },
  tabBar: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 16,
  },
} as const;

export const spacing = {
  xs: 3,
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 20,
  /** Default horizontal inset for scroll content */
  screenHorizontal: 14,
} as const;

export const fontSizes = {
  xs: 13,
  sm: 14,
  md: 15,
  base: 16,
  lg: 17,
  xl: 18,
  xxl: 19,
  hero: 20,
  display: 24,
} as const;

/** Smaller type scale for dense list rows and cards (job cards, wallet, services table, deals, customers). */
export const cardFontSizes = {
  micro: 8,
  tiny: 10,
  xs: 12,
  sm: 13,
  md: 14,
  base: 15,
  lg: 16,
  xl: 17,
  xxl: 18,
  hero: 18,
} as const;

export const radii = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 14,
  xxxl: 16,
  hero: 18,
  round: 999,
} as const;

/** Preset `LinearGradient` color stops */
export const gradients = {
  homeProfile: ["#2563EB", "#93C5FD", "#FFFFFF"] as const,
  homeQuote: ["#3B82F6", "#BFDBFE", "#FFFFFF"] as const,
  dealsHeader: ["#E0EDFF", "#EFF5FF", "#F8FBFF"] as const,
  dealsCard: ["#1D4ED8", "#2563EB", "#60A5FA"] as const,
  profileHero: ["#D7E7FF", "#EAF2FF", "#F8FBFF"] as const,
  websiteHeader: ["#E0EDFF", "#F4F7FD"] as const,
  progress: ["#2563EB", "#7C3AED"] as const,
} as const;

export const typography = {
  screenTitle: { fontSize: fontSizes.hero, fontWeight: "800" as const, color: colors.text },
  heroTitle: { fontSize: fontSizes.display, fontWeight: "800" as const, color: colors.text },
  navTitle: { fontSize: fontSizes.hero, fontWeight: "800" as const, color: colors.text },
  section: { fontSize: fontSizes.xl, fontWeight: "700" as const, color: colors.text },
  cardTitle: { fontSize: fontSizes.lg, fontWeight: "800" as const, color: colors.text },
  body: { fontSize: fontSizes.base, fontWeight: "600" as const, color: colors.text },
  bodyMuted: { fontSize: fontSizes.base, color: colors.textMuted },
  caption: { fontSize: fontSizes.xs, fontWeight: "600" as const },
  label: { fontSize: fontSizes.xs, color: colors.textMuted },
  stat: { fontSize: fontSizes.base, fontWeight: "700" as const, color: colors.text },
} as const;

export const cardTypography = {
  cardTitle: { fontSize: cardFontSizes.lg, fontWeight: "800" as const, color: colors.text },
} as const;

/**
 * `KeyboardAvoidingView` offset for stack screens: gradient header sits *inside* the avoiding view
 * (status bar is above it in `Screen`), so this is header chrome only.
 */
export const stackHeaderKeyboardOffset = 62;

/** Tab root: `TabScreenFrame` gradient header bar (~48) + padding. */
export const tabHeaderKeyboardOffset = 52;
