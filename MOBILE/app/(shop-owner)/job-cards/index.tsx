import { ManageEstimatesModal, ShopJobCardEstimateView, type JobCardActionPreview } from "@/components/job-cards";
import { Fab, StackScreenFrame, SurfaceCard, useToast } from "@/components/reusables";
import { cardFontSizes, cardTypography, colors, fontSizes, radii, shadows, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useJobCardPage, type JobCardListSection } from "@/hooks/use-job-card-page";
import { useKeyboardBottomInset } from "@/hooks/use-keyboard-bottom-inset";
import { useOncePress } from "@/hooks/use-once-press";
import {
  apiMessageFromEnvelope,
  deleteAutoshopJobCard,
  fetchAutoshopJobCardPrefix,
  parseAutoshopJobCardPrefix,
  sendAutoshopJobCardForApproval,
} from "@/lib/autoshopowner-job-cards-api";
import { fetchJobCardRecord } from "@/lib/shop-owner-job-cards-api";
import {
  isEligibleForInvoiceConversion,
  isJobCardApproved,
  isJobCardEditable,
  pickJobCardInvoiceNumber,
  pickJobCardNoForApi,
  type JobCardListRow,
} from "@/lib/shop-owner-job-cards";
import { formatCurrencyAmount } from "@/lib/currency";
import { androidRefreshScrollProps } from "@/lib/refresh-scroll-props";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
  Keyboard,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const JOB_CARD_SECTIONS: { id: JobCardListSection; label: string }[] = [
  { id: "all", label: "My Job Cards" },
  { id: "approvals", label: "Approvals" },
  { id: "invoice", label: "Converted" },
  { id: "paid", label: "Paid Jobs" },
];

function SkeletonLine({ w }: { w: number | `${number}%` }) {
  return <View style={[styles.skeletonLine, { width: w }]} />;
}

function JobCardSkeletonList() {
  return (
    <View style={styles.skeletonList} pointerEvents="none">
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={styles.jobCard}>
          <View style={styles.skeletonSidebar}>
            <SkeletonLine w="72%" />
            <SkeletonLine w="88%" />
          </View>
          <View style={styles.jobCardMain}>
            <View style={styles.skeletonTopRow}>
              <SkeletonLine w="42%" />
              <SkeletonLine w="36%" />
            </View>
            <View style={styles.skeletonVehicleRow}>
              <SkeletonLine w="90%" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function displayJobId(jobNo: string | undefined, prefix?: string): string {
  const raw = (jobNo ?? "").trim().replace(/^#/, "");
  if (!raw) {
    return "—";
  }
  const stripped = raw.replace(/^job\s*#?\s*/i, "").trim();
  if (!stripped) {
    return "—";
  }
  const code = (prefix ?? "").trim();
  if (code && !stripped.toLowerCase().startsWith(code.toLowerCase())) {
    const digits = stripped.replace(/^[A-Za-z]+/, "").trim() || stripped;
    return `${code}${digits}`.toUpperCase();
  }
  if (/^j/i.test(stripped)) {
    return stripped.toUpperCase();
  }
  return `J${stripped}`;
}

function formatCompactJobDate(raw: string | undefined): string {
  const s = (raw ?? "").trim();
  if (!s) {
    return "—";
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
    }
  }
  const parsed = Date.parse(s);
  if (Number.isFinite(parsed)) {
    const d = new Date(parsed);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
    }
  }
  return s.replace(/\b(20\d{2})\b/, (y) => y.slice(-2));
}

function formatReceiptJobDate(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) {
    return "—";
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    }
  }
  const parsed = Date.parse(value);
  if (Number.isFinite(parsed)) {
    const d = new Date(parsed);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    }
  }
  return value;
}

function displayReceiptJobId(jobNo: string | undefined): string {
  const id = displayJobId(jobNo);
  if (id === "—") {
    return id;
  }
  return id.replace(/^J(?=\S)/i, "J ");
}

function displayPhone(phone: string | undefined): string {
  const p = (phone ?? "").trim();
  if (!p) {
    return "—";
  }
  const digits = p.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return p;
}

function formatServiceAmount(price: unknown, countryCode: string | null | undefined): string {
  if (price == null || price === "") {
    return formatCurrencyAmount(0, countryCode, { signSpacing: true, fallback: "—" });
  }
  return formatCurrencyAmount(price as number | string | null | undefined, countryCode, {
    signSpacing: true,
    fallback: "—",
  });
}

type ServiceLine = { name: string; desc: string; price: string };

function extractServiceLines(raw: Record<string, unknown> | null, summary?: string): ServiceLine[] {
  if (!raw) {
    const sum = (summary ?? "").trim();
    return sum ? [{ name: sum, desc: "—", price: "0" }] : [];
  }
  const servicesArr = Array.isArray(raw.services) ? (raw.services as unknown[]) : [];
  const lines: ServiceLine[] = [];
  for (const svc of servicesArr) {
    const svcObj = obj(svc);
    const subs = Array.isArray(svcObj?.subServices) ? (svcObj.subServices as unknown[]) : [];
    for (const sub of subs) {
      const subObj = obj(sub);
      lines.push({
        name: s(subObj?.name) || "—",
        desc: s(subObj?.desc) || "—",
        price: s(subObj?.price) || "0",
      });
    }
  }
  if (lines.length === 0) {
    const sum = (summary ?? s(raw.servicesSummary) ?? s(raw.serviceSummary) ?? "").trim();
    if (sum) {
      lines.push({ name: sum, desc: "—", price: "0" });
    }
  }
  return lines;
}

function sumServiceLines(lines: ServiceLine[]): number {
  return lines.reduce((acc, line) => {
    const n = parseFloat(String(line.price).replace(/[^0-9.-]/g, ""));
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);
}

type LabourDetails = { hours: number | null; charge: number | null };

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function extractLabour(raw: Record<string, unknown> | null): LabourDetails {
  if (!raw) return { hours: null, charge: null };

  const charge =
    num(raw.labourCharge) ??
    num(raw.laborCharge) ??
    num(raw.labourPrice) ??
    num(raw.laborPrice) ??
    num(raw.labourAmount) ??
    num(raw.laborAmount);

  const hours =
    num(raw.labourHours) ??
    num(raw.laborHours) ??
    num(raw.labourDuration) ??
    num(raw.laborDuration) ??
    num(raw.labourTime) ??
    num(raw.laborTime) ??
    num(raw.labourHrs) ??
    num(raw.laborHrs);

  // `add.tsx` currently stores labour hours in `technicalRemarks` like:
  // "Labour: 2 hr, $500"
  const tech = s(raw.technicalRemarks ?? raw.technicianRemarks ?? raw.remarks);
  const hrMatch = /labou?r\s*:\s*([0-9]+(?:\.[0-9]+)?)\s*hr/i.exec(tech);
  const rsMatch = /labou?r\s*:\s*[0-9]+(?:\.[0-9]+)?\s*hr\s*,\s*[^\d-]*([0-9]+(?:\.[0-9]+)?)/i.exec(tech);

  return {
    hours: hours ?? (hrMatch ? num(hrMatch[1]) : null),
    charge: charge ?? (rsMatch ? num(rsMatch[1]) : null),
  };
}

function extractNotes(raw: Record<string, unknown> | null): string {
  if (!raw) return "";
  return (
    s(raw.additionalNotes) ||
    s(raw.notes) ||
    s(raw.note) ||
    s(raw.customerNotes) ||
    s(raw.jobNotes) ||
    ""
  );
}

function pickCustomerCity(raw: Record<string, unknown> | null): string {
  const customer =
    getNested(raw, "customerId") ?? getNested(raw, "customer") ?? getNested(raw, "carOwner");
  return s(customer?.city) || s(customer?.address) || "";
}

function collectDisplayStatuses(row: JobCardListRow, raw: Record<string, unknown> | null): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (v: string | undefined) => {
    const t = (v ?? "").trim();
    if (!t) {
      return;
    }
    const key = t.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    out.push(t);
  };

  if (raw) {
    for (const key of ["statuses", "statusList", "statusHistory", "workflowStatuses", "jobStatuses"]) {
      const arr = raw[key];
      if (!Array.isArray(arr)) {
        continue;
      }
      for (const item of arr) {
        if (typeof item === "string") {
          add(item);
        } else if (item && typeof item === "object") {
          const o = item as Record<string, unknown>;
          add(s(o.status) ?? s(o.label) ?? s(o.name) ?? s(o.value));
        }
      }
    }
  }

  // For shop-owner job cards we only want to display the workflow/job status here.
  // Payment-related labels (Paid/Pending/Unpaid) are shown elsewhere in the UI.
  add(s(raw?.status) ?? s(raw?.jobStatus) ?? row.status);

  return out;
}

function matchesJobCardSearch(row: JobCardListRow, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    row.customerName,
    row.phone,
    row.vehiclePlate,
    row.jobNo,
    row.invoiceNumber,
    pickJobCardInvoiceNumber(row),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

type JobCardViewerState = {
  open: boolean;
  row: JobCardListRow | null;
  actionPreview: JobCardActionPreview | null;
};

function s(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return "";
}

function obj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function pickJobCardFromPayload(payload: unknown): Record<string, unknown> | null {
  const root = obj(payload);
  if (!root) return null;
  const data = obj(root.data);
  const direct = obj(root.jobCard) ?? obj(root.card);
  if (direct) return direct;
  if (data) {
    return obj(data.jobCard) ?? obj(data.card) ?? (data as Record<string, unknown>);
  }
  return root;
}

function getNested(o: Record<string, unknown> | null, key: string): Record<string, unknown> | null {
  if (!o) return null;
  const v = o[key];
  return obj(v);
}

type StatusPalette = { bg: string; border: string; text: string };

type JobCardExpandedPanelProps = {
  row: JobCardListRow;
  detailRaw: Record<string, unknown> | null;
  loading: boolean;
  getStatusPalette: (label: string) => StatusPalette;
  onOpenOptionsMenu: () => void;
};

function JobCardExpandedPanel({
  row,
  detailRaw,
  loading,
  getStatusPalette,
  onOpenOptionsMenu,
}: JobCardExpandedPanelProps) {
  const { meta } = useAuth();
  const raw = detailRaw ?? obj(row.raw);
  const customer =
    getNested(raw, "customerId") ?? getNested(raw, "customer") ?? getNested(raw, "carOwner");
  const vehicle = getNested(raw, "vehicleId") ?? getNested(raw, "vehicle");
  const vehicleMake = getNested(vehicle, "make");
  const customerName = s(customer?.name) || row.customerName?.trim() || "—";
  const phone = displayPhone(s(customer?.phone) || row.phone);
  const city = pickCustomerCity(raw);
  const plate =
    s(vehicle?.licensePlateNo ?? vehicle?.licensePlate) || row.vehiclePlate?.trim() || "—";
  const model =
    s(vehicle?.vehicleName ?? vehicle?.model ?? vehicleMake?.name) ||
    row.vehicleMakeModel?.trim() ||
    "—";
  const odoIn = s((raw as Record<string, unknown> | null)?.odometerReading) || row.odometerCurrent || "—";
  const odoOut = s((raw as Record<string, unknown> | null)?.dueOdometerReading) || row.odometerDue || "—";
  const serviceLines = extractServiceLines(raw, row.servicesSummary);
  const lineSum = sumServiceLines(serviceLines);
  const labour = extractLabour(raw);
  const labourCharge = labour.charge ?? 0;
  const labourHours = labour.hours;
  const subTotal =
    lineSum > 0
      ? lineSum
      : (() => {
        const t = row.total;
        if (typeof t === "number" && Number.isFinite(t)) {
          return t;
        }
        const n = parseFloat(String(t ?? "").replace(/[^0-9.-]/g, ""));
        return Number.isFinite(n) ? n : 0;
      })();
  const rowTotal = (() => {
    const t = row.total;
    if (typeof t === "number" && Number.isFinite(t)) return t;
    const n = parseFloat(String(t ?? "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  })();
  const grandTotal = rowTotal > 0 ? rowTotal : subTotal + labourCharge;
  const statuses = collectDisplayStatuses(row, raw);
  const primaryStatus = statuses[0];
  const otherStatuses = statuses.slice(1);
  const primaryPalette = primaryStatus ? getStatusPalette(primaryStatus) : null;
  const notes = extractNotes(raw);

  return (
    <View style={styles.receiptPanel}>
      <View style={styles.receiptAccent} />

      <View style={styles.receiptHeader}>
        <View style={styles.receiptJobLeft}>
          <Text style={styles.receiptJobPrefix}>Job #</Text>
          <Text style={styles.receiptJobId}>{displayReceiptJobId(row.jobNo)}</Text>
        </View>
        <Text style={styles.receiptDate}>{formatReceiptJobDate(row.date)}</Text>
      </View>

      <View style={styles.receiptRule} />

      <View style={styles.receiptMetaRow}>
        <View style={styles.receiptInfoCard}>
          <Text style={styles.receiptInfoCardTitle}>Customer</Text>
          <View style={styles.receiptInfoCardRule} />
          <View style={styles.receiptInfoCardBody}>
            <Text style={styles.receiptInfoName} numberOfLines={2}>
              {customerName}
            </Text>
            <Text style={styles.receiptInfoAccent} numberOfLines={1}>
              {phone}
            </Text>
            {city ? (
              <Text style={styles.receiptInfoMuted} numberOfLines={2}>
                {city}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.receiptVehicleCol}>
          <View style={styles.receiptInfoCard}>
            <Text style={styles.receiptInfoCardTitle}>VEHICLE</Text>
            <View style={styles.receiptInfoCardRule} />
            <View style={styles.receiptInfoCardBody}>
              <Text style={styles.receiptInfoName} numberOfLines={2}>
                {model}
              </Text>
              <Text style={styles.receiptInfoAccent} numberOfLines={1}>
                {plate}
              </Text>
            </View>
          </View>
          <View style={styles.receiptOdoRow}>
            <View style={styles.receiptOdoBlock}>
              <Text style={styles.receiptOdoLabel}>ODO IN</Text>
              <View style={styles.receiptOdoValueBox}>
                <Text style={styles.receiptOdoValue} numberOfLines={1}>
                  {odoIn}
                </Text>
              </View>
            </View>
            <View style={styles.receiptOdoBlock}>
              <Text style={styles.receiptOdoLabelOut}>ODO OUT</Text>
              <View style={styles.receiptOdoValueBox}>
                <Text style={styles.receiptOdoValue} numberOfLines={1}>
                  {odoOut}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.receiptRule} />

      <View style={styles.receiptTable}>
        <View style={styles.receiptTableHead}>
          <Text style={[styles.receiptTh, styles.receiptColService]}>Service</Text>
          <Text style={[styles.receiptTh, styles.receiptColDesc]}>Description</Text>
          <Text style={[styles.receiptTh, styles.receiptColAmt]}>Amount</Text>
        </View>
        {loading ? (
          <View style={styles.receiptEmpty}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : serviceLines.length === 0 ? (
          <Text style={styles.receiptEmpty}>No services listed.</Text>
        ) : (
          serviceLines.map((line, idx) => (
            <View
              key={`svc-${idx}-${line.name}`}
              style={[styles.receiptTableRow, idx % 2 === 1 ? styles.receiptTableRowAlt : undefined]}
            >
              <Text style={[styles.receiptTd, styles.receiptColService]} numberOfLines={2}>
                {line.name}
              </Text>
              <Text style={[styles.receiptTd, styles.receiptColDesc]} numberOfLines={3}>
                {line.desc}
              </Text>
              <Text style={[styles.receiptTdAmt, styles.receiptColAmt]} numberOfLines={1}>
                {formatServiceAmount(line.price, meta?.countryCode)}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.receiptTotalRow}>
        <Text style={styles.receiptTotalLabel}>Sub Total</Text>
        <View style={styles.receiptTotalDots} />
        <Text style={styles.receiptTotalValue}>{formatServiceAmount(subTotal, meta?.countryCode)}</Text>
      </View>

      {labourCharge > 0 || (labourHours != null && labourHours > 0) ? (
        <View style={styles.receiptTotalRow}>
          <Text style={styles.receiptTotalLabel}>
            Labour{labourHours != null && labourHours > 0 ? ` (${labourHours} hr)` : ""}
          </Text>
          <View style={styles.receiptTotalDots} />
          <Text style={styles.receiptTotalValue}>{formatServiceAmount(labourCharge, meta?.countryCode)}</Text>
        </View>
      ) : null}

      {grandTotal > 0 ? (
        <View style={styles.receiptTotalRow}>
          <Text style={styles.receiptTotalLabel}>Total</Text>
          <View style={styles.receiptTotalDots} />
          <Text style={styles.receiptTotalValue}>{formatServiceAmount(grandTotal, meta?.countryCode)}</Text>
        </View>
      ) : null}

      {notes ? (
        <>
          <View style={styles.receiptRule} />
          <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
            <Text style={{ fontSize: cardFontSizes.xs, fontWeight: "800", color: colors.textMuted, marginBottom: 4 }}>
              Notes
            </Text>
            <Text style={{ fontSize: cardFontSizes.sm, fontWeight: "700", color: colors.text, lineHeight: 18 }}>
              {notes}
            </Text>
          </View>
        </>
      ) : null}

      <View style={styles.receiptRule} />
      <View style={styles.receiptStatusRow}>
        <View style={styles.receiptStatusBlock}>
          {primaryStatus && primaryPalette ? (
            <View
              style={[
                styles.receiptStatusPrimary,
                { backgroundColor: primaryPalette.bg, borderColor: primaryPalette.border },
              ]}
            >
              <Text style={[styles.receiptStatusPrimaryText, { color: primaryPalette.text }]}>
                {primaryStatus}
              </Text>
            </View>
          ) : null}
          {otherStatuses.map((label) => (
            <Text key={label} style={styles.receiptStatusAlt}>
              <Text style={styles.receiptStatusOr}>or </Text>
              {label}
            </Text>
          ))}
        </View>
        <Pressable style={styles.optionsBtn} hitSlop={8} onPress={onOpenOptionsMenu}>
          <Ionicons name="ellipsis-vertical" size={18} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

export default function JobCardsPage() {
  const { qa: qaParam } = useLocalSearchParams<{ qa?: string }>();
  const fromQuickAction = qaParam === "1" || qaParam === "true";
  // `StackScreenFrame` handles bottom safe area for the floating button.
  const { token, meta } = useAuth();
  const { showToast } = useToast();
  const isOwner = (meta?.role ?? "").toLowerCase() === "autoshopowner";
  const [section, setSection] = useState<JobCardListSection>("all");
  const [q, setQ] = useState("");
  const [jobCardPrefix, setJobCardPrefix] = useState("");
  const [manageEstimatesOpen, setManageEstimatesOpen] = useState(false);
  const apiSearch = section === "all" ? q : "";
  const { cards, loading, load } = useJobCardPage(token, isOwner, showToast, section, apiSearch);
  const showListSkeleton = loading && cards.length === 0;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<{
    id: string;
    loading: boolean;
    payload: unknown | null;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [menuRow, setMenuRow] = useState<JobCardListRow | null>(null);
  const [jobCardViewer, setJobCardViewer] = useState<JobCardViewerState>({
    open: false,
    row: null,
    actionPreview: null,
  });

  const keyboardBottom = useKeyboardBottomInset();
  const keyboardOpen = keyboardBottom > 0;
  const closeJobCardViewer = useCallback(() => {
    if (keyboardOpen) {
      Keyboard.dismiss();
      setTimeout(
        () => setJobCardViewer({ open: false, row: null, actionPreview: null }),
        80,
      );
      return;
    }
    setJobCardViewer({ open: false, row: null, actionPreview: null });
  }, [keyboardOpen]);

  const dismissMenu = useCallback(() => {
    setMenuRow(null);
  }, []);
  const dismissMenuRef = useRef(dismissMenu);
  dismissMenuRef.current = dismissMenu;

  const selectSection = useCallback((next: JobCardListSection) => {
    setSection(next);
    setQ("");
    setExpandedId(null);
    setMenuRow(null);
  }, []);

  useEffect(() => {
    if (!token || !isOwner) {
      setJobCardPrefix("");
      return;
    }
    let cancelled = false;
    void fetchAutoshopJobCardPrefix(token)
      .then((res) => {
        if (cancelled || !res.ok) return;
        const prefix = parseAutoshopJobCardPrefix(res.data);
        if (prefix) setJobCardPrefix(prefix);
      })
      .catch(() => {
        /* list falls back to local job no formatting */
      });
    return () => {
      cancelled = true;
    };
  }, [isOwner, token]);

  useEffect(() => {
    if (menuRow == null) {
      return;
    }
    if (expandedId !== menuRow.id) {
      dismissMenu();
    }
  }, [dismissMenu, expandedId, menuRow]);

  useFocusEffect(
    useCallback(() => {
      if (fromQuickAction) {
        setQ("");
        setExpandedId(null);
        dismissMenu();
        router.setParams({ qa: undefined });
        return undefined;
      }
      void load();
      return undefined;
    }, [dismissMenu, fromQuickAction, load])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Let RefreshControl paint first, then do heavier work.
    InteractionManager.runAfterInteractions(() => {
      void load().finally(() => setRefreshing(false));
    });
  }, [load]);

  const filteredCards = useMemo(() => {
    // My List uses API search; other sections filter client-side (web parity).
    if (section === "all" || !q.trim()) {
      return cards;
    }
    return cards.filter((c) => matchesJobCardSearch(c, q));
  }, [cards, q, section]);

  const visibleCards = useMemo(() => {
    if (!expandedId) {
      return filteredCards;
    }
    const hit = filteredCards.find((c) => c.id === expandedId);
    return hit ? [hit] : [];
  }, [expandedId, filteredCards]);

  useEffect(() => {
    if (!expandedId || !token) {
      setExpandedDetail(null);
      return;
    }
    let cancelled = false;
    setExpandedDetail({ id: expandedId, loading: true, payload: null });
    const row = filteredCards.find((c) => c.id === expandedId);
    void fetchJobCardRecord(token, expandedId, { jobCardNo: row?.jobNo })
      .then(({ record }) => {
        if (cancelled) {
          return;
        }
        setExpandedDetail({
          id: expandedId,
          loading: false,
          payload: record,
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setExpandedDetail({
          id: expandedId,
          loading: false,
          payload: row?.raw ?? null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [expandedId, filteredCards, token]);

  const isEmptyState = !showListSkeleton && !loading && filteredCards.length === 0;
  const showActions = section !== "approvals" && section !== "paid";
  const menuCanEditJobCard = menuRow != null && showActions && isJobCardEditable(menuRow);
  const menuCanConvert =
    menuRow != null &&
    section !== "invoice" &&
    section !== "paid" &&
    isEligibleForInvoiceConversion(menuRow);
  const menuCanCashPay =
    menuRow != null &&
    (section === "all" || section === "approvals") &&
    isEligibleForInvoiceConversion(menuRow);
  const menuCanDelete =
    menuRow != null && section === "all" && !isJobCardApproved(menuRow);

  const navigateToCreateJobCard = useOncePress(() => {
    router.push({
      pathname: "/(shop-owner)/job-cards/add",
      params: { backTo: "/(shop-owner)/job-cards" },
    });
  });

  const openJobCardEditor = useOncePress((row: JobCardListRow) => {
    if (!isJobCardEditable(row)) {
      showToast("This job card can no longer be edited.", { type: "info" });
      return;
    }
    dismissMenuRef.current();
    router.push({
      pathname: "/(shop-owner)/job-cards/add",
      params: {
        mode: "edit",
        jobCard: encodeURIComponent(JSON.stringify(row.raw)),
        backTo: "/(shop-owner)/job-cards",
      },
    });
  });

  const getStatusPalette = useCallback((label: string, active?: boolean) => {
    const norm = label.trim().toLowerCase();
    const a = active === true;
    if (norm === "new") {
      return a
        ? { bg: "#CFF3D6", border: "#22C55E", text: "#0F5132" }
        : { bg: "#ECF9EF", border: "#BFE8C8", text: "#2F6B3E" };
    }
    if (norm === "previous") {
      return a
        ? { bg: "#D7E8FF", border: "#2E6BE6", text: "#1E3A8A" }
        : { bg: "#EEF5FF", border: "#C7DBFF", text: "#264A9E" };
    }
    if (norm === "pending") {
      return a
        ? { bg: "#FFE9B6", border: "#F59E0B", text: "#92400E" }
        : { bg: "#FFF5E1", border: "#FED7AA", text: "#9A5B11" };
    }
    if (norm === "approved") {
      return a
        ? { bg: "#CFF3D6", border: "#22C55E", text: "#0F5132" }
        : { bg: "#ECF9EF", border: "#BFE8C8", text: "#2F6B3E" };
    }
    if (norm === "complete" || norm === "completed") {
      return a
        ? { bg: "#D7E8FF", border: "#2563EB", text: "#1E3A8A" }
        : { bg: colors.primaryMutedBg, border: colors.border, text: colors.primary };
    }
    if (norm.includes("approval") || norm.includes("sent")) {
      return a
        ? { bg: "#CFF3D6", border: colors.success, text: colors.successDark }
        : { bg: colors.successMuted, border: "#BBF7D0", text: colors.successDark };
    }
    if (norm === "rejected" || norm === "autorejected" || norm === "auto rejected") {
      return a
        ? { bg: "#FFD1D1", border: "#EF4444", text: "#7F1D1D" }
        : { bg: "#FFEAEA", border: "#FBC2C2", text: "#8A1E1E" };
    }
    if (norm === "paid") {
      return { bg: "#D1FAE5", border: "#10B981", text: "#065F46" };
    }
    if (norm === "unpaid") {
      return { bg: "#FEE2E2", border: "#F87171", text: "#991B1B" };
    }
    return { bg: "#FFF3CD", border: "#FDE68A", text: "#856404" };
  }, []);

  const resendJobCard = useCallback(
    async (row: JobCardListRow) => {
      if (!token) {
        showToast("Sign in to resend notification.");
        return;
      }
      dismissMenu();
      const jobCardNo = pickJobCardNoForApi(row);
      if (!jobCardNo) {
        showToast("Missing job card number.");
        return;
      }
      const res = await sendAutoshopJobCardForApproval(token, jobCardNo);
      const msg = apiMessageFromEnvelope(res.data) ?? "";
      if (!res.ok) {
        showToast(msg || "Could not send for approval.");
        return;
      }
      showToast(msg || "Sent for approval.");
      void load();
    },
    [dismissMenu, load, showToast, token]
  );

  const openJobCardPopup = useOncePress(async (row: JobCardListRow) => {
    if (!token) {
      showToast("Sign in to view job card.");
      return;
    }
    // Android can fail to show a second Modal if we open it while the menu Modal is still visible.
    dismissMenuRef.current();
    await new Promise<void>((r) => setTimeout(r, 50));
    setJobCardViewer({ open: true, row, actionPreview: null });
  });

  const openJobCardEditorFromPreview = useOncePress((row: JobCardListRow) => {
    if (!isJobCardEditable(row)) {
      showToast("This job card can no longer be edited.", { type: "info" });
      return;
    }
    closeJobCardViewer();
    router.push({
      pathname: "/(shop-owner)/job-cards/add",
      params: {
        mode: "edit",
        jobCard: encodeURIComponent(JSON.stringify(row.raw)),
        backTo: "/(shop-owner)/job-cards",
      },
    });
  });

  const convertToInvoice = useCallback(
    async (row: JobCardListRow) => {
      if (!token) {
        showToast("Sign in to convert job card.");
        return;
      }
      if (!isEligibleForInvoiceConversion(row)) {
        showToast("This job card is not eligible for invoice conversion.", { type: "info" });
        return;
      }
      dismissMenuRef.current();
      await new Promise<void>((r) => setTimeout(r, 50));
      setJobCardViewer({ open: true, row, actionPreview: "invoice" });
    },
    [showToast, token],
  );

  const markPaidByCash = useCallback(
    async (row: JobCardListRow) => {
      if (!token) {
        showToast("Sign in to update payment.");
        return;
      }
      if (!isEligibleForInvoiceConversion(row)) {
        showToast("This job card is not eligible for cash payment.", { type: "info" });
        return;
      }
      dismissMenuRef.current();
      await new Promise<void>((r) => setTimeout(r, 50));
      setJobCardViewer({ open: true, row, actionPreview: "cash" });
    },
    [showToast, token],
  );

  const confirmDeleteJobCard = useCallback(
    (row: JobCardListRow) => {
      if (!token) {
        showToast("Sign in to delete.");
        return;
      }
      if (isJobCardApproved(row)) {
        showToast("Approved job cards cannot be deleted.", { type: "info" });
        return;
      }
      dismissMenu();
      Alert.alert("Delete job card?", "This cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              const jobCardNo = pickJobCardNoForApi(row);
              if (!jobCardNo) {
                showToast("Missing job card number.");
                return;
              }
              const res = await deleteAutoshopJobCard(token, jobCardNo);
              const payload = res.data as unknown;
              const msg = apiMessageFromEnvelope(payload) ?? "";
              const success =
                res.ok &&
                (!(payload && typeof payload === "object" && "success" in payload) ||
                  (payload as { success?: unknown }).success === true);
              if (!success) {
                showToast(msg || "Could not delete job card.");
                return;
              }
              showToast("Job card deleted.");
              setExpandedId(null);
              void load();
            })();
          },
        },
      ]);
    },
    [dismissMenu, load, showToast, token]
  );

  const openManageEstimates = useOncePress(() => {
    setManageEstimatesOpen(true);
  });

  return (
    <StackScreenFrame
      title="Job Card"
      backgroundColor={colors.bgProfile}
      scroll={false}
      right={
        <Pressable
          style={styles.headerIconBtn}
          onPress={() => openManageEstimates?.()}
          accessibilityLabel="Manage estimates"
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </Pressable>
      }
      floatingContent={
        expandedId == null && section === "all" ? (
          <Fab label="New Job Card" onPress={() => navigateToCreateJobCard?.()} />
        ) : undefined
      }
    >
      <View style={styles.pageWrap}>
        <View style={styles.stickyHeader}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sectionTabs}
            style={styles.sectionTabsScroll}
          >
            {JOB_CARD_SECTIONS.map((tab) => {
              const active = section === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => selectSection(tab.id)}
                  style={[styles.sectionTab, active && styles.sectionTabActive]}
                >
                  <Text style={[styles.sectionTabText, active && styles.sectionTabTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={20} color={colors.primary} />
            <TextInput
              placeholder="Name / mobile / Vehicle number"
              placeholderTextColor={colors.textLight}
              style={styles.searchInput}
              value={q}
              onChangeText={setQ}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {q.trim() ? (
              <Pressable
                onPress={() => {
                  setQ("");
                }}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={22} color={colors.textLight} />
              </Pressable>
            ) : null}
          </View>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            isEmptyState ? styles.contentEmpty : styles.contentFilled,
            expandedId ? styles.contentExpanded : null,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          alwaysBounceVertical
          {...androidRefreshScrollProps(onRefresh)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {showListSkeleton ? <JobCardSkeletonList /> : null}

          {isEmptyState ? (
            <SurfaceCard shadow="soft" style={styles.emptyCard}>
              <Ionicons name="file-tray-outline" size={40} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No job cards</Text>
              <Text style={styles.emptySub}>
                {q.trim()
                  ? "Try a different search."
                  : section === "approvals"
                    ? "No cards awaiting approval."
                    : section === "invoice"
                      ? "No converted invoices yet."
                      : section === "paid"
                        ? "No paid jobs yet."
                        : "No job cards yet."}
              </Text>
            </SurfaceCard>
          ) : null}

          {!showListSkeleton
            ? visibleCards.map((row) => {
              const open = expandedId === row.id;
              const toggleExpand = () => setExpandedId((prev) => (prev === row.id ? null : row.id));
              const plate = row.vehiclePlate?.trim() || "—";
              const model = row.vehicleMakeModel?.trim() || "—";
              const invoiceNo = section === "invoice" ? pickJobCardInvoiceNumber(row) : "";
              const detailRaw =
                expandedDetail?.id === row.id
                  ? pickJobCardFromPayload(expandedDetail.payload) ?? obj(row.raw)
                  : obj(row.raw);
              const detailLoading = expandedDetail?.id === row.id && expandedDetail.loading;
              return (
                <SurfaceCard
                  key={row.id}
                  shadow="card"
                  style={open ? { ...styles.jobCard, ...styles.jobCardOpen } : styles.jobCard}
                >
                  <View style={styles.jobCardRow}>
                    <View style={styles.jobSidebar}>
                      <Text style={styles.jobIdText} numberOfLines={1}>
                        {displayJobId(row.jobNo, jobCardPrefix)}
                      </Text>
                      <Text style={styles.jobDateText} numberOfLines={1}>
                        {formatCompactJobDate(row.date)}
                      </Text>
                      {invoiceNo ? (
                        <Text style={styles.invoiceNoText} numberOfLines={1}>
                          {invoiceNo}
                        </Text>
                      ) : null}
                    </View>

                    <View style={styles.jobCardMain}>
                      <View style={styles.jobCardTop}>
                        <Pressable style={styles.jobCardTopPress} onPress={toggleExpand}>
                          <Text style={styles.customerName} numberOfLines={1}>
                            {row.customerName?.trim() || "Customer"}
                          </Text>
                          <View style={styles.phonePill}>
                            <Text style={styles.phoneText} numberOfLines={1}>
                              {displayPhone(row.phone)}
                            </Text>
                          </View>
                        </Pressable>
                        <Pressable style={styles.chevronBtn} onPress={toggleExpand} hitSlop={8}>
                          <Ionicons
                            name={open ? "chevron-up" : "chevron-down"}
                            size={18}
                            color={colors.primary}
                          />
                        </Pressable>
                      </View>

                      <Pressable style={styles.vehicleBar} onPress={toggleExpand}>
                        <Text style={styles.plate} numberOfLines={1}>
                          {plate}
                        </Text>
                        <Text style={styles.vehicleDash}> - </Text>
                        <Text style={styles.makeModel} numberOfLines={1}>
                          {model}
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {open ? (
                    <JobCardExpandedPanel
                      row={row}
                      detailRaw={detailRaw}
                      loading={detailLoading}
                      getStatusPalette={getStatusPalette}
                      onOpenOptionsMenu={() => setMenuRow(row)}
                    />
                  ) : null}
                </SurfaceCard>
              );
            })
            : null}
        </ScrollView>

        <Modal visible={menuRow != null} transparent animationType="slide" onRequestClose={dismissMenu}>
          <View style={styles.optionsModalRoot}>
            <Pressable style={styles.optionsModalBackdrop} onPress={dismissMenu} />
            {menuRow ? (
              <View style={styles.optionsModalSheet}>
                <View style={styles.optionsModalHeader}>
                  <View style={styles.optionsModalHeaderText}>
                    <Text style={styles.optionsModalTitle}>Job card options</Text>
                    <Text style={styles.optionsModalSub} numberOfLines={1}>
                      {displayJobId(menuRow.jobNo, jobCardPrefix)} ·{" "}
                      {menuRow.customerName?.trim() || "Customer"}
                    </Text>
                  </View>
                  <Pressable style={styles.optionsModalClose} onPress={dismissMenu} hitSlop={8}>
                    <Ionicons name="close" size={20} color={colors.textMuted} />
                  </Pressable>
                </View>

                <Pressable style={styles.optionsModalRow} onPress={() => void openJobCardPopup?.(menuRow)}>
                  <Ionicons name="eye-outline" size={22} color={colors.primary} />
                  <Text style={styles.optionsModalRowLabel}>View</Text>
                </Pressable>

                {showActions ? (
                  <>
                    <View style={styles.optionsModalDivider} />
                    <Pressable
                      style={[styles.optionsModalRow, !menuCanEditJobCard && styles.optionsModalRowDisabled]}
                      disabled={!menuCanEditJobCard}
                      onPress={() => openJobCardEditor?.(menuRow)}
                    >
                      <Ionicons
                        name="create-outline"
                        size={22}
                        color={menuCanEditJobCard ? colors.primary : colors.textLight}
                      />
                      <Text
                        style={[
                          styles.optionsModalRowLabel,
                          !menuCanEditJobCard && styles.optionsModalRowLabelDisabled,
                        ]}
                      >
                        Edit
                      </Text>
                    </Pressable>
                  </>
                ) : null}

                <View style={styles.optionsModalDivider} />
                <Pressable style={styles.optionsModalRow} onPress={() => void resendJobCard(menuRow)}>
                  <Ionicons name="paper-plane-outline" size={22} color={colors.primary} />
                  <Text style={styles.optionsModalRowLabel}>Resend</Text>
                </Pressable>

                {menuCanConvert ? (
                  <>
                    <View style={styles.optionsModalDivider} />
                    <Pressable style={styles.optionsModalRow} onPress={() => void convertToInvoice(menuRow)}>
                      <Ionicons name="document-text-outline" size={22} color={colors.primary} />
                      <Text style={styles.optionsModalRowLabel}>Convert to Invoice</Text>
                    </Pressable>
                  </>
                ) : null}

                {menuCanCashPay ? (
                  <>
                    <View style={styles.optionsModalDivider} />
                    <Pressable style={styles.optionsModalRow} onPress={() => void markPaidByCash(menuRow)}>
                      <Ionicons name="cash-outline" size={22} color={colors.primary} />
                      <Text style={styles.optionsModalRowLabel}>Paid by Cash</Text>
                    </Pressable>
                  </>
                ) : null}

                {menuCanDelete ? (
                  <>
                    <View style={styles.optionsModalDivider} />
                    <Pressable style={styles.optionsModalRow} onPress={() => confirmDeleteJobCard(menuRow)}>
                      <Ionicons name="trash-outline" size={22} color={colors.danger} />
                      <Text style={[styles.optionsModalRowLabel, styles.optionsModalRowDanger]}>Delete</Text>
                    </Pressable>
                  </>
                ) : null}

                <Pressable style={styles.optionsModalCancel} onPress={dismissMenu}>
                  <Text style={styles.optionsModalCancelText}>Cancel</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </Modal>

        <ManageEstimatesModal
          visible={manageEstimatesOpen}
          authToken={token}
          onClose={() => setManageEstimatesOpen(false)}
          onSaved={(prefix) => {
            if (prefix) setJobCardPrefix(prefix);
          }}
        />

        <Modal
          visible={jobCardViewer.open && jobCardViewer.row != null}
          transparent
          animationType="fade"
          onRequestClose={closeJobCardViewer}
        >
          <View style={styles.viewerBackdrop}>
            <Pressable style={styles.viewerBackdropPress} onPress={closeJobCardViewer} />
            <View style={styles.viewerCard}>
              {jobCardViewer.row ? (
                <ShopJobCardEstimateView
                  key={jobCardViewer.row.id}
                  jobCardId={jobCardViewer.row.id}
                  listRow={jobCardViewer.row}
                  jobNoHint={jobCardViewer.row.jobNo ?? null}
                  initialActionPreview={jobCardViewer.actionPreview}
                  onBack={closeJobCardViewer}
                  onEdit={() => openJobCardEditorFromPreview?.(jobCardViewer.row!)}
                  onActionPreviewChange={(preview) =>
                    setJobCardViewer((prev) => ({ ...prev, actionPreview: preview }))
                  }
                  onConverted={() => {
                    setExpandedId(null);
                    closeJobCardViewer();
                    void load();
                  }}
                  onCashPaid={() => {
                    setExpandedId(null);
                    closeJobCardViewer();
                    void load();
                  }}
                />
              ) : null}
            </View>
          </View>
        </Modal>
      </View>
    </StackScreenFrame>
  );
}

const styles = StyleSheet.create({
  pageWrap: { flex: 1, position: "relative" },
  stickyHeader: {
    backgroundColor: colors.bgProfile,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTabsScroll: {
    flexGrow: 0,
  },
  sectionTabs: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.screenHorizontal,
  },
  sectionTab: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  sectionTabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.iconBlueTint,
  },
  sectionTabText: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textMuted,
  },
  sectionTabTextActive: {
    color: colors.primary,
  },
  scroll: { flex: 1 },
  content: {
    paddingBottom: 120,
    paddingTop: spacing.sm,
  },
  contentFilled: {
    flexGrow: 1,
  },
  contentExpanded: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  contentEmpty: {
    flexGrow: 0,
  },
  searchWrap: {
    height: 44,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: "#ECF7EE",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.screenHorizontal,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: spacing.sm,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  loading: { alignItems: "center", paddingVertical: spacing.xl, gap: spacing.sm },
  loadingText: { color: colors.textMuted, fontSize: fontSizes.md },
  skeletonList: { gap: spacing.md, paddingTop: spacing.sm },
  skeletonSidebar: {
    width: 64,
    backgroundColor: colors.primaryMutedBg,
    padding: spacing.xs,
    gap: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  skeletonTopRow: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 6,
    padding: spacing.sm,
    paddingRight: spacing.md,
    flex: 1,
    justifyContent: "center",
  },
  skeletonVehicleRow: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: "#EEF1F5",
  },
  skeletonLine: { height: 12, borderRadius: 8, backgroundColor: "#D5DDE8" },
  emptyCard: {
    marginHorizontal: spacing.screenHorizontal,
    marginTop: spacing.sm,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyTitle: { ...cardTypography.cardTitle, marginTop: spacing.sm },
  emptySub: { fontSize: cardFontSizes.sm, color: colors.textMuted, textAlign: "center" },
  jobCard: {
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
    padding: 0,
    overflow: "hidden",
    borderRadius: radii.lg,
  },
  jobCardOpen: {
    marginBottom: spacing.lg,
  },
  jobCardRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: 72,
  },
  jobSidebar: {
    width: 64,
    backgroundColor: colors.primaryMutedBg,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
  },
  jobIdText: {
    width: "100%",
    fontSize: cardFontSizes.sm,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.1,
    textAlign: "center",
  },
  jobDateText: {
    width: "100%",
    fontSize: cardFontSizes.micro,
    fontWeight: "600",
    color: colors.textMuted,
    lineHeight: 11,
    textAlign: "center",
  },
  invoiceNoText: {
    width: "100%",
    marginTop: 2,
    fontSize: 9,
    fontWeight: "700",
    color: colors.primary,
    textAlign: "center",
  },
  jobCardMain: {
    flex: 1,
    minWidth: 0,
  },
  jobCardTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.white,
  },
  jobCardTopPress: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: spacing.xs,
    minWidth: 0,
  },
  customerName: {
    alignSelf: "stretch",
    fontSize: cardFontSizes.md,
    fontWeight: "800",
    color: colors.text,
  },
  phonePill: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    backgroundColor: colors.primaryMutedBg,
    borderRadius: radii.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  phoneText: {
    fontSize: cardFontSizes.sm,
    fontWeight: "700",
    color: colors.primary,
  },
  chevronBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primaryMutedBg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  vehicleBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: "#EEF1F5",
    minWidth: 0,
  },
  plate: {
    flexShrink: 1,
    fontSize: cardFontSizes.sm,
    fontWeight: "700",
    color: colors.text,
    textTransform: "uppercase",
  },
  vehicleDash: {
    fontSize: cardFontSizes.sm,
    fontWeight: "700",
    color: colors.text,
    flexShrink: 0,
  },
  makeModel: {
    flexShrink: 1,
    fontSize: cardFontSizes.sm,
    color: colors.primary,
    fontWeight: "700",
  },
  receiptPanel: {
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    overflow: "hidden",
    ...shadows.soft,
  },
  receiptAccent: {
    height: 4,
    backgroundColor: colors.primary,
  },
  receiptHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  receiptJobLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: spacing.xs,
    minWidth: 0,
  },
  receiptJobPrefix: {
    fontSize: cardFontSizes.sm,
    fontWeight: "600",
    color: colors.textMuted,
    lineHeight: 20,
  },
  receiptJobId: {
    fontSize: cardFontSizes.md,
    fontWeight: "800",
    color: colors.success,
    lineHeight: 20,
  },
  receiptDate: {
    fontSize: cardFontSizes.sm,
    fontWeight: "600",
    color: colors.textMuted,
    lineHeight: 18,
  },
  receiptRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  receiptMetaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  receiptInfoCard: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  receiptVehicleCol: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  receiptInfoCardTitle: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    fontSize: cardFontSizes.sm,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    lineHeight: 18,
  },
  receiptInfoCardRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  receiptInfoCardBody: {
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  receiptInfoName: {
    width: "100%",
    fontSize: cardFontSizes.md,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    lineHeight: 20,
  },
  receiptInfoAccent: {
    width: "100%",
    fontSize: cardFontSizes.sm,
    fontWeight: "700",
    color: colors.primary,
    textAlign: "center",
    lineHeight: 18,
  },
  receiptInfoMuted: {
    width: "100%",
    fontSize: cardFontSizes.sm,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  receiptOdoRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  receiptOdoBlock: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  receiptOdoLabel: {
    fontSize: cardFontSizes.micro,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    letterSpacing: 0.3,
    lineHeight: 14,
  },
  receiptOdoLabelOut: {
    fontSize: cardFontSizes.micro,
    fontWeight: "800",
    color: colors.danger,
    textAlign: "center",
    letterSpacing: 0.3,
    lineHeight: 14,
  },
  receiptOdoValueBox: {
    borderRadius: radii.sm,
    backgroundColor: "#E8EDFF",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  receiptOdoValue: {
    fontSize: cardFontSizes.sm,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    lineHeight: 18,
  },
  receiptTable: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  receiptTableHead: {
    flexDirection: "row",
    backgroundColor: colors.primaryMutedBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  receiptTh: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    fontSize: cardFontSizes.xs,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 16,
  },
  receiptTableRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  receiptTableRowAlt: {
    backgroundColor: colors.bgAlt,
  },
  receiptTd: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    fontSize: cardFontSizes.sm,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 18,
  },
  receiptTdAmt: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    fontSize: cardFontSizes.sm,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "right",
    lineHeight: 18,
  },
  receiptColService: { flex: 1.05, minWidth: 0 },
  receiptColDesc: { flex: 1.55, minWidth: 0, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border },
  receiptColAmt: {
    flex: 0.8,
    minWidth: 0,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
  },
  receiptEmpty: {
    padding: spacing.sm,
    fontSize: cardFontSizes.sm,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  receiptTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  receiptTotalLabel: {
    fontSize: cardFontSizes.sm,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 18,
  },
  receiptTotalDots: {
    flex: 1,
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderStyle: "dotted",
    marginBottom: 4,
  },
  receiptTotalValue: {
    fontSize: cardFontSizes.sm,
    fontWeight: "900",
    color: colors.primary,
    lineHeight: 18,
  },
  receiptStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  receiptStatusBlock: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
    minWidth: 0,
  },
  optionsBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryMutedBg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  receiptStatusPrimary: {
    alignSelf: "stretch",
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  receiptStatusPrimaryText: {
    fontSize: cardFontSizes.sm,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 18,
  },
  receiptStatusAlt: {
    fontSize: cardFontSizes.xs,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 16,
  },
  receiptStatusOr: {
    color: colors.textLight,
    fontWeight: "500",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E8EC",
    backgroundColor: colors.white,
  },
  footerBadges: { flexDirection: "row", flexWrap: "wrap", gap: 4, alignItems: "center", flex: 1 },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginLeft: "auto",
  },
  footerDate: { fontSize: cardFontSizes.xs, color: colors.textMuted },
  statusPill: {
    borderWidth: 1,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: radii.md,
  },
  statusPillText: { fontSize: cardFontSizes.tiny, fontWeight: "800" },
  footerTotal: { fontSize: cardFontSizes.md, fontWeight: "800", color: colors.primary },
  optionsModalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  optionsModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  optionsModalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingBottom: spacing.xl,
    ...shadows.card,
  },
  optionsModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionsModalHeaderText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  optionsModalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "800",
    color: colors.text,
  },
  optionsModalSub: {
    fontSize: cardFontSizes.sm,
    fontWeight: "600",
    color: colors.textMuted,
  },
  optionsModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgAlt,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  optionsModalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  optionsModalRowLabel: {
    fontSize: cardFontSizes.md,
    color: colors.text,
    fontWeight: "700",
  },
  optionsModalRowDisabled: {
    opacity: 0.45,
  },
  optionsModalRowLabelDisabled: {
    color: colors.textLight,
  },
  optionsModalRowDanger: {
    color: colors.danger,
  },
  optionsModalDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  optionsModalCancel: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.bgAlt,
    alignItems: "center",
  },
  optionsModalCancelText: {
    fontSize: cardFontSizes.md,
    fontWeight: "700",
    color: colors.textMuted,
  },
  // addBtn styles removed: now using StackScreenFrame `floatingContent`

  viewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.screenHorizontal,
  },
  viewerBackdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  viewerCard: {
    width: "100%",
    height: "86%",
    minHeight: 260,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...shadows.card,
  },

});

