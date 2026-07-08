/** Amber palette for business-associate UI (distinct from shop-owner blue and car-owner green). */
export const associateColors = {
  primary: "#D97706",
  primaryDark: "#B45309",
  primaryMuted: "#FEF3C7",
  primaryMutedBg: "#FFFBEB",
  tabInactive: "#A8A29E",
  tabBarBg: "#FEF3C7",
  tabBarBorder: "#FCD34D",
  textOnPrimary: "#78350F",
  badgeBg: "rgba(217,119,6,0.18)",
  badgeText: "#92400E",
  onlineDot: "#16A34A",
  offlineDot: "#DC2626",
  onlineRowBg: "rgba(254,243,199,0.94)",
  onlineRowBorder: "rgba(217,119,6,0.32)",
  offlineRowBg: "rgba(254,226,226,0.92)",
  offlineRowBorder: "rgba(220,38,38,0.28)",
  switchTrackOn: "#FDE68A",
  switchThumbOn: "#D97706",
  switchThumbOff: "#F87171",
  iconTint: "#FDE68A",
  bg: "#FFFBEB",
  quoteBorder: "rgba(251,191,36,0.45)",
  quickActionBorder: "rgba(251,191,36,0.28)",
  quickActionPressedBg: "#FFFBEB",
} as const;

export const associateGradients = {
  profileHero: ["#FEF3C7", "#FDE68A", "#FBBF24"] as const,
  header: [associateColors.tabBarBg, associateColors.tabBarBg, associateColors.tabBarBg] as const,
  quote: ["#F59E0B", "#FDE68A", "#FFFBEB"] as const,
};

export const ASSOCIATE_TAB_BAR_OFFSET = 78;
