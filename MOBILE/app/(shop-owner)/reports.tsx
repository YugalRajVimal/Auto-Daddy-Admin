import { LoadingProgress, StackScreenFrame, SurfaceCard, useToast } from "@/components/reusables";
import { colors, fontSizes, radii, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { formatCurrencyAmount } from "@/lib/currency";
import {
  loadShopBankReport,
  loadShopExpenseReport,
  loadShopGstReport,
  loadShopIncomeReport,
  type ShopReportBankRow,
  type ShopReportGstRow,
  type ShopReportLedgerRow,
} from "@/lib/shop-owner-reports-api";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

type ReportKind = "income" | "expenses" | "bank" | "gst";

const KINDS: { id: ReportKind; label: string }[] = [
  { id: "income", label: "Income" },
  { id: "expenses", label: "Expenses" },
  { id: "bank", label: "Banks" },
  { id: "gst", label: "GST" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function ReportsPage() {
  const { token, meta } = useAuth();
  const { showToast } = useToast();
  const isOwner = (meta?.role ?? "").toLowerCase() === "autoshopowner";
  const [kind, setKind] = useState<ReportKind>("income");
  const [fromDate, setFromDate] = useState(monthStartIso());
  const [toDate, setToDate] = useState(todayIso());
  const [loading, setLoading] = useState(false);
  const [ledgerRows, setLedgerRows] = useState<ShopReportLedgerRow[]>([]);
  const [gstRows, setGstRows] = useState<ShopReportGstRow[]>([]);
  const [bankRows, setBankRows] = useState<ShopReportBankRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !isOwner) return;
    setLoading(true);
    setError(null);
    try {
      if (kind === "income") {
        const res = await loadShopIncomeReport(token, fromDate, toDate);
        setLedgerRows(res.rows);
      } else if (kind === "expenses") {
        const rows = await loadShopExpenseReport(token, fromDate, toDate);
        setLedgerRows(rows);
      } else if (kind === "gst") {
        const rows = await loadShopGstReport(token, fromDate, toDate);
        setGstRows(rows);
      } else {
        const rows = await loadShopBankReport(token);
        setBankRows(rows);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not load report.";
      setError(msg);
      setLedgerRows([]);
      setGstRows([]);
      setBankRows([]);
      showToast(msg, { type: "error" });
    } finally {
      setLoading(false);
    }
  }, [fromDate, isOwner, kind, showToast, toDate, token]);

  const total = useMemo(() => {
    if (kind === "bank") {
      return bankRows.reduce((sum, row) => sum + (Number(row.totalBalance) || 0), 0);
    }
    if (kind === "gst") {
      return gstRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    }
    return ledgerRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  }, [bankRows, gstRows, kind, ledgerRows]);

  if (!isOwner) {
    return (
      <StackScreenFrame title="Reports" backgroundColor={colors.bgProfile} backTo="/(shop-owner)/profile">
        <Text style={styles.muted}>This screen is for shop owners.</Text>
      </StackScreenFrame>
    );
  }

  return (
    <StackScreenFrame title="Reports" backgroundColor={colors.bgProfile} backTo="/(shop-owner)/profile" scroll={false}>
      <View style={styles.root}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {KINDS.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setKind(item.id)}
              style={[styles.tab, kind === item.id && styles.tabActive]}
            >
              <Text style={[styles.tabText, kind === item.id && styles.tabTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {kind !== "bank" ? (
          <View style={styles.filters}>
            <TextInput
              style={styles.input}
              value={fromDate}
              onChangeText={setFromDate}
              placeholder="From YYYY-MM-DD"
              placeholderTextColor={colors.textLight}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              value={toDate}
              onChangeText={setToDate}
              placeholder="To YYYY-MM-DD"
              placeholderTextColor={colors.textLight}
              autoCapitalize="none"
            />
          </View>
        ) : null}

        <Pressable style={styles.loadBtn} onPress={() => void load()}>
          <Text style={styles.loadBtnText}>{loading ? "Loading…" : "Load report"}</Text>
        </Pressable>

        {loading ? <LoadingProgress /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {kind === "bank"
            ? bankRows.map((row) => (
                <SurfaceCard key={row.id} shadow="soft" style={styles.card}>
                  <Text style={styles.cardTitle}>{row.label}</Text>
                  <Text style={styles.cardMeta}>
                    {row.accountName || "—"} · {formatCurrencyAmount(row.totalBalance, meta?.countryCode)}
                  </Text>
                </SurfaceCard>
              ))
            : kind === "gst"
              ? gstRows.map((row) => (
                  <SurfaceCard key={row.id} shadow="soft" style={styles.card}>
                    <Text style={styles.cardTitle}>
                      {row.vendor} · {row.ledgerType}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {row.date} · {formatCurrencyAmount(row.amount, meta?.countryCode)}
                    </Text>
                    <Text style={styles.cardNotes} numberOfLines={2}>
                      {row.notes || row.category}
                    </Text>
                  </SurfaceCard>
                ))
              : ledgerRows.map((row) => (
                  <SurfaceCard key={row.id} shadow="soft" style={styles.card}>
                    <Text style={styles.cardTitle}>{row.vendor}</Text>
                    <Text style={styles.cardMeta}>
                      {row.date} · {formatCurrencyAmount(row.amount, meta?.countryCode)}
                    </Text>
                    <Text style={styles.cardNotes} numberOfLines={2}>
                      {row.notes || `${row.category} / ${row.subcategory}`}
                    </Text>
                  </SurfaceCard>
                ))}
          {!loading && !error ? (
            <Text style={styles.total}>Total: {formatCurrencyAmount(total, meta?.countryCode)}</Text>
          ) : null}
        </ScrollView>
      </View>
    </StackScreenFrame>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  muted: { color: colors.textMuted, padding: spacing.md },
  tabs: { gap: spacing.sm, paddingBottom: spacing.sm },
  tab: {
    borderRadius: radii.round,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.text, fontSize: fontSizes.sm, fontWeight: "600" },
  tabTextActive: { color: colors.white },
  filters: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.white,
  },
  loadBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  loadBtnText: { color: colors.white, fontWeight: "700" },
  error: { color: colors.danger, marginBottom: spacing.sm },
  list: { flex: 1 },
  listContent: { gap: spacing.sm, paddingBottom: spacing.xl },
  card: { padding: spacing.md },
  cardTitle: { fontSize: fontSizes.md, fontWeight: "700", color: colors.text },
  cardMeta: { marginTop: 4, color: colors.textMuted, fontSize: fontSizes.sm },
  cardNotes: { marginTop: 4, color: colors.textLight, fontSize: fontSizes.xs },
  total: { marginTop: spacing.md, fontWeight: "700", color: colors.text, fontSize: fontSizes.md },
});
