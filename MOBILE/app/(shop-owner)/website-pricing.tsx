import { AppBar, SurfaceCard, TabScreenFrame, useToast } from "@/components/reusables";
import { colors, fontSizes, gradients, radii, spacing, typography } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { formatCurrencyAmount } from "@/lib/currency";
import {
  createSubscriptionCheckout,
  extractCheckoutSession,
  formatSubscriptionApiError,
} from "@/lib/shop-owner-subscription-api";
import { selectWebsiteTemplate } from "@/lib/shop-owner-website-api";
import { canOpenStripeCheckout } from "@/lib/stripe-payment";
import { StripeCheckoutModal } from "@/components/shop-owner/stripe-checkout-modal";
import type { SubscriptionCheckoutSession } from "@/types/website-subscription";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PriceRow = { label: string; amount: number; icon: keyof typeof Ionicons.glyphMap; tone: string };

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <SurfaceCard shadow="card" style={styles.infoCard}>
      {children}
    </SurfaceCard>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <SurfaceCard shadow="card" style={styles.sectionCard}>
      {children}
    </SurfaceCard>
  );
}

function GradientShell({ children }: { children: React.ReactNode }) {
  return (
    <SurfaceCard shadow="card" style={styles.gradientShellCard}>
      <LinearGradient
        colors={[colors.primary, "#4F8CFF", colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientShell}
      >
        {children}
      </LinearGradient>
    </SurfaceCard>
  );
}

export default function WebsitePricingPage() {
  const { meta, token } = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ templateId?: string; templateName?: string }>();
  const templateName = (params.templateName ?? "Template 1").trim() || "Template 1";
  const templateId = (params.templateId ?? "").trim();
  const { showToast } = useToast();
  const [checkoutSession, setCheckoutSession] = useState<SubscriptionCheckoutSession | null>(null);
  const [paying, setPaying] = useState(false);

  const rows: PriceRow[] = useMemo(
    () => [
      { label: "Website Price", amount: 2999, icon: "desktop-outline", tone: colors.primary },
      { label: "Domain Price", amount: 799, icon: "globe-outline", tone: colors.purple },
      { label: "Hosting Price", amount: 1499, icon: "server-outline", tone: colors.successDark },
    ],
    []
  );

  const total = useMemo(() => rows.reduce((s, r) => s + r.amount, 0), [rows]);
  const [accepted, setAccepted] = useState(false);

  const bottom = Math.max(insets.bottom, spacing.md);
  const footerBtnHeight = 56;
  const footerGap = 12;
  const footerTextHeight = 18;

  async function handlePay() {
    if (!accepted) return;
    if (!token) {
      showToast("Please sign in again.", { type: "error" });
      return;
    }
    setPaying(true);
    try {
      if (templateId) {
        await selectWebsiteTemplate(token, templateId);
      }
      const res = await createSubscriptionCheckout(token, {
        planId: "yearly",
        successUrl: "https://app.autodaddy.ca/shop/my-website?checkout=success",
        cancelUrl: "https://app.autodaddy.ca/shop/my-website?checkout=cancel",
      });
      if (!res.ok || res.data?.success === false) {
        showToast(formatSubscriptionApiError(res.data), { type: "error" });
        return;
      }
      const session = extractCheckoutSession(res.data);
      if (!session?.checkoutUrl && !session?.stripeSessionId) {
        showToast("Payment session not returned.", { type: "error" });
        return;
      }
      if (!canOpenStripeCheckout(session)) {
        showToast("Stripe checkout is not available for this session.", { type: "error" });
        return;
      }
      setCheckoutSession(session);
    } catch {
      showToast("Network error starting payment.", { type: "error" });
    } finally {
      setPaying(false);
    }
  }

  return (
    <TabScreenFrame
      header={
        <AppBar
          title="Website"
          leadingMode="back"
          onBackPress={() => router.replace("/(shop-owner)/website")}
        />
      }
      headerGradient={gradients.websiteHeader}
      backgroundColor={colors.bgProfile}
      scroll={false}
    >
      <View style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: spacing.lg,
              paddingBottom: bottom + footerBtnHeight + footerGap + footerTextHeight,
            },
          ]}
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical
        >
          <GradientShell>
            <View style={styles.selectedRow}>
              <View style={styles.selectedLeft}>
                <View style={styles.selectedIconOnGradient}>
                  <Ionicons name="globe-outline" size={18} color={colors.white} />
                </View>
                <View style={styles.selectedText}>
                  <Text style={styles.selectedLabelOnGradient}>SELECTED TEMPLATE</Text>
                  <Text style={styles.selectedValueOnGradient}>{templateName}</Text>
                </View>
              </View>
              <View style={styles.activePill}>
                <Ionicons name="checkmark" size={14} color={colors.white} />
                <Text style={styles.activeText}>Active</Text>
              </View>
            </View>
          </GradientShell>

          <SectionCard>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>PRICING DETAILS</Text>
              <Text style={styles.sectionHint}>One-time setup + 1 year benefits</Text>
            </View>
            <View style={styles.priceList}>
              {rows.map((r) => (
                <View key={r.label} style={styles.priceRow}>
                  <View style={[styles.priceIcon, { backgroundColor: `${r.tone}22` }]}>
                    <Ionicons name={r.icon} size={18} color={r.tone} />
                  </View>
                  <Text style={styles.priceLabel}>{r.label}</Text>
                  <Text style={styles.priceAmount}>
                    {formatCurrencyAmount(r.amount, meta?.countryCode, { fallback: "—" })}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.totalBar}>
              <LinearGradient
                colors={[colors.primaryDark, colors.primary, "#4F8CFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.totalBarGradient}
              >
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalAmount}>
                  {formatCurrencyAmount(total, meta?.countryCode, { fallback: "—" })}
                </Text>
              </LinearGradient>
            </View>
          </SectionCard>

          <InfoCard>
            <View style={styles.sectionHeader}>
              <Text style={styles.getTitle}>🎁 What You Get (First Time)</Text>
              <Text style={styles.sectionHint}>Included with this plan</Text>
            </View>
            <View style={styles.getList}>
              {[
                "Your own professional website",
                "Custom domain for 1 year",
                "Reliable hosting for 1 year",
                "Free subscription to use this software for 1 year",
                "24/7 customer support",
                "Mobile-friendly design",
              ].map((t) => (
                <View key={t} style={styles.getRow}>
                  <View style={styles.getDot}>
                    <Ionicons name="checkmark" size={14} color={colors.white} />
                  </View>
                  <Text style={styles.getText}>{t}</Text>
                </View>
              ))}
            </View>
            <View style={styles.getFooterPill}>
              <Text style={styles.getFooterText}>🎁 Website + Subscription FREE for 1 Year!</Text>
            </View>
          </InfoCard>

          <SectionCard>
            <Pressable style={styles.termsRow} onPress={() => setAccepted((v) => !v)}>
              <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
                {accepted ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
              </View>
              <Text style={styles.termsText}>
                I agree to the{" "}
                <Text style={styles.termsLink}>Terms & Conditions</Text> and authorize the payment of{" "}
                <Text style={styles.termsStrong}>
                  {formatCurrencyAmount(total, meta?.countryCode, { fallback: "—" })}
                </Text>{" "}
                for the selected package.
              </Text>
            </Pressable>
          </SectionCard>
        </ScrollView>

        <View style={[styles.footer, { left: spacing.screenHorizontal, right: spacing.screenHorizontal, bottom }]}>
          <BlurView intensity={28} tint="light" style={styles.footerBlur} />
          <Pressable
            style={[styles.payButton, { minHeight: footerBtnHeight }, (!accepted || paying) && styles.payButtonDisabled]}
            onPress={() => {
              void handlePay();
            }}
            disabled={!accepted || paying}
          >
            <LinearGradient
              colors={[colors.primaryDark, colors.primary, "#4F8CFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.payButtonGradient}
            >
              <Text style={styles.payButtonText}>{paying ? "Starting…" : "Proceed to Payment"}</Text>
            </LinearGradient>
          </Pressable>
          <Text style={styles.secureText}>Secure payment · SSL encrypted</Text>
        </View>
      </View>
      <StripeCheckoutModal
        visible={checkoutSession != null}
        session={checkoutSession}
        onClose={() => setCheckoutSession(null)}
        onComplete={() => {
          setCheckoutSession(null);
          showToast("Payment completed.", { type: "success" });
          router.replace("/(shop-owner)/website");
        }}
        onError={(message) => {
          showToast(message || "Payment failed.", { type: "error" });
        }}
      />
    </TabScreenFrame>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  infoCard: {
    backgroundColor: colors.primaryMutedBg,
    borderRadius: radii.xxl,
    padding: spacing.lg,
  },
  gradientShellCard: {
    borderRadius: radii.xxl,
    overflow: "hidden",
  },
  gradientShell: {
    padding: spacing.lg,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xxl,
    padding: spacing.lg,
  },
  sectionHeader: { marginBottom: spacing.md },
  selectedRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectedLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  selectedIconOnGradient: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedText: { gap: 2 },
  selectedLabelOnGradient: {
    fontSize: fontSizes.xs,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  selectedValueOnGradient: {
    fontSize: fontSizes.hero,
    fontWeight: "900",
    color: colors.white,
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
  },
  activeText: { color: colors.white, fontWeight: "900", fontSize: fontSizes.sm },

  sectionTitle: { ...typography.cardTitle, color: colors.text, fontSize: fontSizes.lg, fontWeight: "900" },
  sectionHint: { marginTop: 2, color: colors.textMuted, fontSize: fontSizes.sm, fontWeight: "700" },
  priceList: { gap: spacing.sm },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  priceIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  priceLabel: { flex: 1, fontSize: fontSizes.md, fontWeight: "700", color: colors.textMuted },
  priceAmount: { fontSize: fontSizes.lg, fontWeight: "900", color: colors.text },
  totalBar: { marginTop: spacing.md, borderRadius: 14, overflow: "hidden" },
  totalBarGradient: {
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: { color: colors.white, fontWeight: "800", fontSize: fontSizes.md },
  totalAmount: { color: colors.white, fontWeight: "900", fontSize: fontSizes.display },

  getTitle: { ...typography.cardTitle, fontSize: fontSizes.lg, fontWeight: "900", color: colors.primaryBlue900 },
  getList: { marginTop: spacing.md, gap: spacing.sm },
  getRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  getDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  getText: { flex: 1, color: colors.text, fontSize: fontSizes.md, fontWeight: "700", lineHeight: 20 },
  getFooterPill: {
    marginTop: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  getFooterText: { color: colors.white, fontWeight: "900", fontSize: fontSizes.sm },

  termsRow: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  termsText: { flex: 1, color: colors.textMuted, fontSize: fontSizes.md, fontWeight: "700", lineHeight: 20 },
  termsLink: { color: colors.primary, fontWeight: "900" },
  termsStrong: { color: colors.text, fontWeight: "900" },

  payButton: {
    borderRadius: 999,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  payButtonGradient: {
    width: "100%",
    minHeight: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: { color: colors.white, fontWeight: "900", fontSize: fontSizes.lg },
  footer: {
    position: "absolute",
    gap: 6,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(220,230,246,0.8)",
    backgroundColor: "rgba(255,255,255,0.55)",
    padding: spacing.md,
  },
  footerBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  secureText: {
    textAlign: "center",
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: "700",
  },
});

