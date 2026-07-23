import {
  ChevronLabelBar,
  OverviewStatRow,
  Pill,
  ProgressBar,
  SectionHeader,
  SegmentedControl,
  SurfaceCard,
} from "@/components/reusables";
import { cardFontSizes, colors, radii, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { formatCurrencyAmount } from "@/lib/currency";
import type { DashboardIncomeOverview } from "@/types/dashboard-details";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

const TIMEFRAMES = ["All", "Daily", "Weekly", "Monthly"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

const OVERVIEW_SECTIONS = ["Income", "Job Card", "Customers", "Services", "Subscription"] as const;
type OverviewSection = (typeof OVERVIEW_SECTIONS)[number];

// Placeholder until per-section API payloads are wired.
const DUMMY = {
  income: { sale: 1000, received: 700 },
  jobCard: { total: 24, completed: 18, inProgress: 6 },
  customers: { total: 156, newThisMonth: 12, returning: 89 },
  services: { listed: 32, active: 28, inactive: 4 },
  subscription: { daysLeft: 45, planDays: 90, usedDays: 45 },
} as const;

type StatConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  iconBackground: string;
  iconColor: string;
  rowBackground: string;
};

function money(n: number, countryCode: string | null | undefined) {
  const safe = Number.isFinite(n) ? n : 0;
  return formatCurrencyAmount(Math.round(safe), countryCode, { signSpacing: true, fallback: "—" });
}

function count(n: number) {
  const safe = Number.isFinite(n) ? n : 0;
  return String(Math.round(safe));
}

function percent(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function cycleSection(current: OverviewSection, delta: -1 | 1): OverviewSection {
  const index = OVERVIEW_SECTIONS.indexOf(current);
  const next = (index + delta + OVERVIEW_SECTIONS.length) % OVERVIEW_SECTIONS.length;
  return OVERVIEW_SECTIONS[next];
}

export function Overview({
  incomeOverview,
  subscriptionDaysLeft,
}: {
  incomeOverview?: DashboardIncomeOverview | null;
  subscriptionDaysLeft?: number | null;
}) {
  const { meta } = useAuth();
  const [timeframe, setTimeframe] = useState<Timeframe>("All");
  const [section, setSection] = useState<OverviewSection>("Income");

  const view = useMemo(() => {
    const daily = incomeOverview?.daily;
    const canUseApiDailyIncome = (timeframe === "Daily" || timeframe === "All") && daily != null;
    const subDays =
      typeof subscriptionDaysLeft === "number" && Number.isFinite(subscriptionDaysLeft)
        ? Math.max(0, subscriptionDaysLeft)
        : DUMMY.subscription.daysLeft;

    switch (section) {
      case "Income": {
        const total = canUseApiDailyIncome ? (daily.totalSale ?? 0) : DUMMY.income.sale;
        const received = canUseApiDailyIncome ? (daily.received ?? 0) : DUMMY.income.received;
        const pending = canUseApiDailyIncome
          ? (daily.pending ?? Math.max(0, total - received))
          : Math.max(0, DUMMY.income.sale - DUMMY.income.received);
        return {
          stats: [
            {
              icon: "layers-outline",
              label: "Total Sale",
              value: money(total, meta?.countryCode),
              iconBackground: colors.iconBlueTint,
              iconColor: colors.primary,
              rowBackground: colors.white,
            },
            {
              icon: "checkmark-circle",
              label: "Received",
              value: money(received, meta?.countryCode),
              iconBackground: colors.successMuted,
              iconColor: colors.success,
              rowBackground: colors.successMuted,
            },
            {
              icon: "time-outline",
              label: "Pending",
              value: money(pending, meta?.countryCode),
              iconBackground: colors.warningMuted,
              iconColor: colors.warning,
              rowBackground: colors.warningMuted,
            },
          ] satisfies StatConfig[],
          progressLabel: "Collection Rate",
          progressPercent: percent(received, total),
        };
      }
      case "Job Card": {
        const { total, completed, inProgress } = DUMMY.jobCard;
        return {
          stats: [
            {
              icon: "document-text-outline",
              label: "Total Jobs",
              value: count(total),
              iconBackground: colors.iconBlueTint,
              iconColor: colors.primary,
              rowBackground: colors.white,
            },
            {
              icon: "checkmark-done-outline",
              label: "Completed",
              value: count(completed),
              iconBackground: colors.successMuted,
              iconColor: colors.success,
              rowBackground: colors.successMuted,
            },
            {
              icon: "construct-outline",
              label: "In Progress",
              value: count(inProgress),
              iconBackground: colors.warningMuted,
              iconColor: colors.warning,
              rowBackground: colors.warningMuted,
            },
          ] satisfies StatConfig[],
          progressLabel: "Completion Rate",
          progressPercent: percent(completed, total),
        };
      }
      case "Customers": {
        const { total, newThisMonth, returning } = DUMMY.customers;
        return {
          stats: [
            {
              icon: "people-outline",
              label: "Total Customers",
              value: count(total),
              iconBackground: colors.iconBlueTint,
              iconColor: colors.primary,
              rowBackground: colors.white,
            },
            {
              icon: "person-add-outline",
              label: "New This Month",
              value: count(newThisMonth),
              iconBackground: colors.successMuted,
              iconColor: colors.success,
              rowBackground: colors.successMuted,
            },
            {
              icon: "repeat-outline",
              label: "Returning",
              value: count(returning),
              iconBackground: colors.warningMuted,
              iconColor: colors.warning,
              rowBackground: colors.warningMuted,
            },
          ] satisfies StatConfig[],
          progressLabel: "Retention Rate",
          progressPercent: percent(returning, total),
        };
      }
      case "Services": {
        const { listed, active, inactive } = DUMMY.services;
        return {
          stats: [
            {
              icon: "grid-outline",
              label: "Listed Services",
              value: count(listed),
              iconBackground: colors.iconBlueTint,
              iconColor: colors.primary,
              rowBackground: colors.white,
            },
            {
              icon: "flash-outline",
              label: "Active",
              value: count(active),
              iconBackground: colors.successMuted,
              iconColor: colors.success,
              rowBackground: colors.successMuted,
            },
            {
              icon: "pause-circle-outline",
              label: "Inactive",
              value: count(inactive),
              iconBackground: colors.warningMuted,
              iconColor: colors.warning,
              rowBackground: colors.warningMuted,
            },
          ] satisfies StatConfig[],
          progressLabel: "Active Rate",
          progressPercent: percent(active, listed),
        };
      }
      case "Subscription": {
        const planDays = DUMMY.subscription.planDays;
        const daysLeft = subDays;
        const usedDays = Math.max(0, planDays - daysLeft);
        return {
          stats: [
            {
              icon: "ribbon-outline",
              label: "Plan Duration",
              value: `${count(planDays)} days`,
              iconBackground: colors.iconBlueTint,
              iconColor: colors.primary,
              rowBackground: colors.white,
            },
            {
              icon: "calendar-outline",
              label: "Days Left",
              value: `${count(daysLeft)} days`,
              iconBackground: colors.successMuted,
              iconColor: colors.success,
              rowBackground: colors.successMuted,
            },
            {
              icon: "hourglass-outline",
              label: "Days Used",
              value: `${count(usedDays)} days`,
              iconBackground: colors.warningMuted,
              iconColor: colors.warning,
              rowBackground: colors.warningMuted,
            },
          ] satisfies StatConfig[],
          progressLabel: "Plan Usage",
          progressPercent: percent(usedDays, planDays),
        };
      }
      default: {
        const _exhaustive: never = section;
        return _exhaustive;
      }
    }
  }, [incomeOverview, meta?.countryCode, section, subscriptionDaysLeft, timeframe]);

  return (
    <SurfaceCard shadow="card" style={styles.card}>
      <SectionHeader
        title="Overview"
        right={
          <Pill variant="primaryMuted">
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={styles.calendarText}>May 2026</Text>
          </Pill>
        }
      />
      <ChevronLabelBar
        label={section}
        variant="services"
        style={styles.incomeBar}
        onPrevious={() => setSection((current) => cycleSection(current, -1))}
        onNext={() => setSection((current) => cycleSection(current, 1))}
      />
      <View style={styles.segmentWrap}>
        <SegmentedControl options={TIMEFRAMES} value={timeframe} onChange={setTimeframe} />
      </View>
      <View style={styles.statsBlock}>
        {view.stats.map((stat) => (
          <OverviewStatRow key={stat.label} {...stat} />
        ))}
      </View>
      <ProgressBar label={view.progressLabel} percent={view.progressPercent} />
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xxxl,
    padding: spacing.xl,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: "#EEF2FF",
  },
  calendarText: { fontSize: cardFontSizes.base, fontWeight: "800", color: colors.primary },
  incomeBar: { marginBottom: spacing.md + 2 },
  segmentWrap: { marginBottom: spacing.lg },
  statsBlock: { marginBottom: spacing.sm },
});
