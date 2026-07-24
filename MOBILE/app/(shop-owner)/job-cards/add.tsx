import { CustomerCard } from "@/components/customers";
import { ExpandableCard, LoadingProgress, StackScreenFrame, SurfaceCard, useToast } from "@/components/reusables";
import { colors, fontSizes, radii, shadows, spacing, typography } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { customerKey } from "@/hooks/use-my-customers";
import { useOncePress } from "@/hooks/use-once-press";
import { formatCurrencyAmount, getCurrencySign } from "@/lib/currency";
import {
  findAutoshopServiceDealForSub,
  type AutoshopPageDetailsServiceDeal,
} from "@/lib/autoshopowner-job-cards-api";
import { extractEstimateDiscount } from "@/lib/shop-job-card-estimate";
import {
  fetchJobCardFormData,
  normalizeJobCardServiceBlocks,
  saveJobCard,
  type JobCardFormCustomer,
} from "@/lib/shop-owner-job-cards-api";
import type { CustomerVehicle, MyCustomer } from "@/types/auto-shop-owner-endpoints";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Phase = "customer" | "configure";

type ServiceLine = {
  id: string;
  subKey: string | null;
  desc: string;
  unitPriceStr: string;
  qtyStr: string;
  priceStr: string;
  labourCostStr: string;
  odoOutStr?: string;
};

type ServiceCategoryLike = {
  id: string;
  name?: string;
  odoOutRequired?: boolean;
  subServices: Array<{
    name: string;
    desc?: string;
    price?: number;
    qty?: number;
    make?: string;
    model?: string;
    labourCost?: number;
    odoOutRequired?: boolean;
  }>;
};

type SubServiceOption = {
  key: string;
  catId: string;
  subIdx: number;
  label: string;
  desc: string;
  price: number;
  qty: number;
  labourCost: number;
  categoryName?: string;
};

type ApiJobCardSubService = {
  name?: string;
  desc?: string;
  price?: number | string;
  unitPrice?: number | string;
  unitCost?: number | string;
  qty?: string | number;
  unit?: string | number;
  labourCost?: number | string;
  labourCharge?: number | string;
  labourDuration?: string | number;
  dueOdometerReading?: string | number;
  odoOut?: string | number;
  odoOutReading?: string | number;
  amountBeforeDiscount?: number | string;
  discountPercentage?: number | string;
  dealId?: string;
};

type ApiJobCard = {
  _id?: string;
  customerId?: { _id?: string; name?: string; email?: string; phone?: string };
  vehicleId?: {
    _id?: string;
    licensePlateNo?: string;
    make?: { name?: string; model?: string };
    vehicleName?: string;
    model?: string;
    odometerReading?: string | number;
  };
  odometerReading?: number | string;
  odoIn?: number | string;
  dueOdometerReading?: number | string;
  odoOut?: number | string;
  otherCharges?: number | string;
  labourCharge?: number | string;
  labourDuration?: string | number;
  discount?: string | number;
  terms?: string;
  additionalNotes?: string;
  services?: Array<
    | { service?: string; serviceId?: string; subServices?: ApiJobCardSubService[] }
    | (ApiJobCardSubService & {
        service?: string;
        serviceId?: string;
        category?: string;
        subServiceName?: string;
        amount?: number | string;
      })
  >;
};

function displayPhone(c: MyCustomer) {
  const cc = c.countryCode?.trim();
  const p = c.phone?.trim();
  if (cc && p) {
    return `${cc} ${p}`;
  }
  return p ?? "";
}

function mapPageDetailsVehicle(
  v: JobCardFormCustomer["myVehicles"][number]
): CustomerVehicle {
  const makeObj = v.make && typeof v.make === "object" ? v.make : null;
  return {
    _id: v._id,
    vId: v.vId,
    licensePlateNo: v.licensePlateNo?.trim() || v.regNo?.trim() || undefined,
    vinNo: v.vinNo?.trim() || v.vin?.trim() || undefined,
    vehicleName: v.vehicleName?.trim() || makeObj?.name?.trim() || v.brand?.trim() || undefined,
    model: v.model?.trim() || makeObj?.model?.trim() || undefined,
    year: v.year != null && String(v.year).trim() ? String(v.year) : undefined,
    odometerReading:
      v.odometerReading != null && String(v.odometerReading).trim()
        ? String(v.odometerReading)
        : undefined,
    dueOdometerReading:
      v.dueOdometerReading != null && String(v.dueOdometerReading).trim()
        ? String(v.dueOdometerReading)
        : undefined,
  };
}

function mapPageDetailsCustomer(c: JobCardFormCustomer): MyCustomer {
  return {
    _id: c._id,
    name: c.name,
    phone: c.phone,
    countryCode: c.countryCode,
    city: c.city,
    vehicles: (c.myVehicles ?? []).map(mapPageDetailsVehicle),
  };
}

function vehicleApiId(v: CustomerVehicle): string | undefined {
  const id = v._id?.trim();
  return id || undefined;
}

function vehicleLabel(v: CustomerVehicle): string {
  const plate = v.licensePlateNo?.trim();
  if (plate) {
    return plate;
  }
  const mm = [v.vehicleName, v.model].filter(Boolean).join(" ");
  return mm || "Vehicle";
}

function vehicleMakeModelKey(vehicle: CustomerVehicle | null): { make: string; model: string } {
  if (!vehicle) return { make: "", model: "" };
  const make = (vehicle.vehicleName ?? "").trim().toLowerCase();
  const model = (vehicle.model ?? "").trim().toLowerCase();
  return { make, model };
}

/** Keep unscoped subs (no make/model) for any vehicle; match scoped ones by make+model. */
function subServiceMatchesVehicle(
  sub: { make?: string; model?: string },
  vehicle: CustomerVehicle | null
): boolean {
  if (!vehicle) return false;
  const subMake = (sub.make ?? "").trim().toLowerCase();
  const subModel = (sub.model ?? "").trim().toLowerCase();
  if (!subMake && !subModel) return true;
  const { make, model } = vehicleMakeModelKey(vehicle);
  if (!make || !model) return false;
  return subMake === make && subModel === model;
}

function filterCategoriesForVehicle(
  categories: ServiceCategoryLike[],
  vehicle: CustomerVehicle | null
): ServiceCategoryLike[] {
  if (!vehicle) return [];
  return categories
    .map((cat) => ({
      ...cat,
      subServices: (cat.subServices || []).filter((sub) => subServiceMatchesVehicle(sub, vehicle)),
    }))
    .filter((cat) => cat.subServices.length > 0);
}

function customerSearchHay(c: MyCustomer): string {
  return [c.name, c.phone, c.email, customerKey(c)].filter(Boolean).join(" ").toLowerCase();
}

function vehicleSearchHay(v: CustomerVehicle): string {
  return [v.licensePlateNo, v.vehicleName, v.model, v.vinNo].filter(Boolean).join(" ").toLowerCase();
}

function vehiclesToShowUnderCustomer(c: MyCustomer, searchTrimmedLower: string): CustomerVehicle[] {
  const list = c.vehicles ?? [];
  if (!searchTrimmedLower) {
    return list;
  }
  if (customerSearchHay(c).includes(searchTrimmedLower)) {
    return list;
  }
  return list.filter((v) => vehicleSearchHay(v).includes(searchTrimmedLower));
}

function parseAmount(s: string): number {
  const n = parseFloat(String(s).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function subServiceKey(catId: string, subIdx: number): string {
  return `${catId}:${subIdx}`;
}

function parseSubServiceKey(key: string): { catId: string; subIdx: number } | null {
  const sep = key.lastIndexOf(":");
  if (sep < 0) {
    return null;
  }
  const catId = key.slice(0, sep);
  const subIdx = parseInt(key.slice(sep + 1), 10);
  if (!catId || !Number.isFinite(subIdx)) {
    return null;
  }
  return { catId, subIdx };
}

function categoryRequiresOdoOut(catId: string, categories: ServiceCategoryLike[]): boolean {
  return Boolean(categories.find((c) => c.id === catId)?.odoOutRequired);
}

function lineRequiresOdoOut(line: ServiceLine, categories: ServiceCategoryLike[]): boolean {
  const parsed = parseSubServiceKey(line.subKey ?? "");
  if (!parsed) return false;
  const cat = categories.find((c) => c.id === parsed.catId);
  if (!cat) return false;
  if (cat.odoOutRequired) return true;
  return Boolean(cat.subServices?.[parsed.subIdx]?.odoOutRequired);
}

function vehicleOdoOutPlaceholder(vehicle: CustomerVehicle | null): string {
  if (!vehicle) return "Out";
  const dueRaw = vehicle.dueOdometerReading;
  if (dueRaw != null && String(dueRaw).trim() !== "") {
    return String(dueRaw).trim();
  }
  const inVal = vehicle.odometerReading?.trim() || "0";
  const n = Number(inVal);
  return String(Number.isFinite(n) ? n + 500 : 500);
}

function defaultOdoOutForCategory(
  catId: string,
  categories: ServiceCategoryLike[],
  vehicle: CustomerVehicle | null
): string {
  if (!categoryRequiresOdoOut(catId, categories)) return "";
  return vehicleOdoOutPlaceholder(vehicle).replace(/\D/g, "");
}

function resolveDueOdometerReading(lines: ServiceLine[], categories: ServiceCategoryLike[]): string {
  let max = 0;
  let any = false;
  for (const line of lines) {
    if (!line.subKey || !lineRequiresOdoOut(line, categories)) continue;
    const val = parseAmount(line.odoOutStr ?? "");
    if (val > 0) {
      any = true;
      if (val > max) max = val;
    }
  }
  return any ? String(max) : "0";
}

function calcLineAmount(line: Pick<ServiceLine, "unitPriceStr" | "qtyStr">): number {
  return parseAmount(line.unitPriceStr) * parseAmount(line.qtyStr);
}

function priceStrFromLine(line: Pick<ServiceLine, "unitPriceStr" | "qtyStr">): string {
  const total = calcLineAmount(line);
  return Number.isFinite(total) ? String(total) : "0";
}

function defaultLineForSub(
  id: string,
  catId: string,
  subIdx: number,
  sub: { desc?: string; price?: number; qty?: number; labourCost?: number },
  categories: ServiceCategoryLike[],
  vehicle: CustomerVehicle | null
): ServiceLine {
  const labourCost =
    typeof sub?.labourCost === "number" && Number.isFinite(sub.labourCost) ? sub.labourCost : 0;
  const qty =
    typeof sub?.qty === "number" && Number.isFinite(sub.qty) && sub.qty > 0 ? sub.qty : 1;
  const draft = {
    unitPriceStr: String(sub?.price ?? 0),
    qtyStr: String(qty),
  };
  return {
    id,
    subKey: subServiceKey(catId, subIdx),
    desc: sub?.desc ?? "",
    labourCostStr: String(labourCost),
    odoOutStr: defaultOdoOutForCategory(catId, categories, vehicle),
    ...draft,
    priceStr: priceStrFromLine(draft),
  };
}

function emptyServiceLine(id: string): ServiceLine {
  return {
    id,
    subKey: null,
    desc: "",
    unitPriceStr: "",
    qtyStr: "1",
    priceStr: "0",
    labourCostStr: "0",
    odoOutStr: "",
  };
}

function buildLabourTechnicalRemarks(
  labourCharge: number,
  discountStr: string,
  countryCode: string | null | undefined
): string {
  const other = String(discountStr ?? "").trim();
  const otherAmt = parseAmount(other);
  if (labourCharge <= 0 && !other) {
    return "";
  }
  const fmt = (x: number) =>
    formatCurrencyAmount(x, countryCode, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      fallback: "",
    });
  const parts: string[] = [];
  if (labourCharge > 0) {
    parts.push(fmt(labourCharge));
  }
  if (other) {
    parts.push(otherAmt > 0 ? `Discount: ${fmt(otherAmt)}` : `Discount: ${other}`);
  }
  return parts.length ? `Labour: ${parts.join("; ")}` : "";
}

function findCatalogSubIndex(
  cat: ServiceCategoryLike,
  ss: Record<string, unknown>,
): number {
  const subName = String(ss.name ?? ss.subServiceName ?? "").trim();
  const desc = String(ss.desc ?? "").trim();
  if (subName) {
    const byName = cat.subServices.findIndex((s) => s.name === subName);
    if (byName >= 0) return byName;
  }
  if (desc) {
    const byDesc = cat.subServices.findIndex(
      (s) => (s.desc ?? "").trim() === desc || s.name.trim() === desc,
    );
    if (byDesc >= 0) return byDesc;
  }
  if (cat.subServices.length === 1) return 0;
  const unitPrice = parseAmount(String(ss.unitPrice ?? ss.unitCost ?? ss.price ?? ""));
  if (unitPrice > 0) {
    const byPrice = cat.subServices.findIndex((s) => (s.price ?? 0) === unitPrice);
    if (byPrice >= 0) return byPrice;
  }
  return -1;
}

function apiServiceBlocksToLines(
  blocks: unknown[] | ApiJobCard["services"],
  categories: ServiceCategoryLike[],
  dueOdometerReading?: string
): ServiceLine[] {
  const lines: ServiceLine[] = [];
  let n = 0;
  const dueFallback = String(dueOdometerReading ?? "").replace(/\D/g, "");
  for (const block of blocks || []) {
    if (!block || typeof block !== "object") continue;
    const b = block as { service?: string; subServices?: Array<Record<string, unknown>> };
    const catId = String(b.service || "").trim();
    if (!catId) {
      continue;
    }
    const cat = categories.find((c) => c.id === catId);
    if (!cat) {
      continue;
    }
    for (const ss of b.subServices || []) {
      const subIdx = findCatalogSubIndex(cat, ss);
      if (subIdx < 0) {
        continue;
      }
      const catalogSub = cat.subServices[subIdx];
      const qtyStr = String(ss.qty ?? ss.unit ?? "1");
      const qty = parseAmount(qtyStr) || 1;
      const labour = parseAmount(String(ss.labourCost ?? ss.labourCharge ?? "0"));
      const savedTotal = parseAmount(String(ss.price ?? ss.amount ?? ""));
      const beforeDiscount = parseAmount(String(ss.amountBeforeDiscount ?? ""));
      let unitPriceStr =
        ss.unitPrice != null
          ? String(ss.unitPrice)
          : ss.unitCost != null
            ? String(ss.unitCost)
            : "";
      if (!unitPriceStr && beforeDiscount > 0 && qty > 0) {
        unitPriceStr = String(beforeDiscount / qty);
      } else if (!unitPriceStr && savedTotal > 0 && qty > 0) {
        unitPriceStr = String(Math.max(0, (savedTotal - labour) / qty));
      } else if (!unitPriceStr) {
        unitPriceStr = String(catalogSub?.price ?? 0);
      }
      n += 1;
      const draft = { unitPriceStr, qtyStr };
      const odoRaw = ss.dueOdometerReading ?? ss.odoOutReading ?? ss.odoOut ?? "";
      let odoOutStr = String(odoRaw).replace(/\D/g, "");
      const needsOdo =
        Boolean(cat.odoOutRequired) || Boolean(catalogSub?.odoOutRequired);
      if (needsOdo && !odoOutStr && dueFallback) {
        odoOutStr = dueFallback;
      }
      lines.push({
        id: `line-${n}`,
        subKey: subServiceKey(catId, subIdx),
        desc: String(ss.desc ?? catalogSub?.desc ?? ""),
        labourCostStr: String(
          labour > 0
            ? labour
            : typeof catalogSub?.labourCost === "number"
              ? catalogSub.labourCost
              : 0,
        ),
        odoOutStr: needsOdo ? odoOutStr : "",
        ...draft,
        priceStr: priceStrFromLine(draft),
      });
    }
  }
  return lines;
}

function serviceLinesToBlocks(
  lines: ServiceLine[],
  categories: ServiceCategoryLike[],
  serviceDeals: AutoshopPageDetailsServiceDeal[] = [],
) {
  const map = new Map<string, Array<Record<string, unknown>>>();
  for (const line of lines) {
    if (!line.subKey) {
      continue;
    }
    const parsed = parseSubServiceKey(line.subKey);
    if (!parsed) {
      continue;
    }
    const cat = categories.find((c) => c.id === parsed.catId);
    const sub = cat?.subServices?.[parsed.subIdx];
    if (!sub?.name) {
      continue;
    }
    const bucket = map.get(parsed.catId) ?? [];
    const qty = String(line.qtyStr || "").trim();
    const unitPrice = parseAmount(line.unitPriceStr);
    const amount = calcLineAmount(line);
    const labourCost = parseAmount(line.labourCostStr);
    const qtyNum = parseAmount(line.qtyStr) || 1;
    const entry: Record<string, unknown> = {
      name: sub.name,
      desc: String(line.desc || "").trim(),
      unit: qty,
      qty,
      unitPrice,
      price: amount,
      labourCharge: labourCost,
      labourCost,
    };
    if (lineRequiresOdoOut(line, categories)) {
      const odoOutReading = parseAmount(line.odoOutStr ?? "");
      if (odoOutReading > 0) {
        entry.dueOdometerReading = String(odoOutReading);
        entry.odoOut = String(odoOutReading);
        entry.odoOutReading = odoOutReading;
      }
    }
    const deal = findAutoshopServiceDealForSub(serviceDeals, parsed.catId, sub.name);
    if (deal) {
      const discountPercentage = Number(deal.discountPercentage);
      if (Number.isFinite(discountPercentage) && discountPercentage > 0) {
        entry.discountPercentage = discountPercentage;
        entry.amountBeforeDiscount = unitPrice * qtyNum;
        entry.dealId = deal._id;
      }
    }
    bucket.push(entry);
    map.set(parsed.catId, bucket);
  }
  return [...map.entries()].map(([service, subServices]) => ({ service, subServices }));
}

function lineDealDiscount(
  line: ServiceLine,
  categories: ServiceCategoryLike[],
  serviceDeals: AutoshopPageDetailsServiceDeal[],
): number {
  if (!line.subKey) return 0;
  const parsed = parseSubServiceKey(line.subKey);
  if (!parsed) return 0;
  const cat = categories.find((c) => c.id === parsed.catId);
  const sub = cat?.subServices?.[parsed.subIdx];
  if (!sub?.name) return 0;
  const deal = findAutoshopServiceDealForSub(serviceDeals, parsed.catId, sub.name);
  if (!deal) return 0;
  const pct = Number(deal.discountPercentage);
  if (!Number.isFinite(pct) || pct <= 0) return 0;
  return (calcLineAmount(line) * pct) / 100;
}

function formatJobCardDate(d = new Date()): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function extractTermsNotes(raw: ApiJobCard): string {
  return (raw.terms || raw.additionalNotes || "").trim();
}

export default function NewJobCardPage() {
  const insets = useSafeAreaInsets();
  const { token, meta } = useAuth();
  const { showToast } = useToast();
  const isOwner = (meta?.role ?? "").toLowerCase() === "autoshopowner";
  const params = useLocalSearchParams<{ backTo?: string; mode?: string; jobCard?: string }>();
  const backTo =
    typeof params.backTo === "string" && params.backTo.startsWith("/") ? params.backTo : "/(shop-owner)/job-cards";
  const isEditMode = params.mode === "edit";

  const [pageLoading, setPageLoading] = useState(true);
  const [customers, setCustomers] = useState<MyCustomer[]>([]);
  const [categories, setCategories] = useState<ServiceCategoryLike[]>([]);
  const [serviceDeals, setServiceDeals] = useState<AutoshopPageDetailsServiceDeal[]>([]);
  const [displayJobNo, setDisplayJobNo] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("customer");
  const [selectedCustomer, setSelectedCustomer] = useState<MyCustomer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<CustomerVehicle | null>(null);
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [expandedServiceCatId, setExpandedServiceCatId] = useState<string | null>(null);
  const didAutoExpandServiceCatRef = useRef(false);
  const lineIdRef = useRef(0);
  const [odomCurrent, setOdomCurrent] = useState("");
  const [discount, setDiscount] = useState("");
  const [labourCharge, setLabourCharge] = useState("");
  const [termsNotes, setTermsNotes] = useState("");
  const [editingJobCardId, setEditingJobCardId] = useState<string | null>(null);
  const [editingJobCardNo, setEditingJobCardNo] = useState<string | number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const allCategoriesWithSubs = useMemo(
    () =>
      categories
        .filter((c) => c.subServices.length > 0)
        .map((c) => ({
          ...c,
          subServices: c.subServices.map((s) => ({
            ...s,
            labourCost: typeof s.labourCost === "number" ? s.labourCost : Number(s.labourCost) || 0,
            odoOutRequired: Boolean(s.odoOutRequired),
          })),
        })),
    [categories]
  );

  const categoriesWithSubs = useMemo(
    () => filterCategoriesForVehicle(allCategoriesWithSubs, selectedVehicle),
    [allCategoriesWithSubs, selectedVehicle]
  );
  const hasShopServices = categories.length > 0;
  const hasAnySubServices = allCategoriesWithSubs.length > 0;

  const subServiceOptions = useMemo<SubServiceOption[]>(() => {
    const out: SubServiceOption[] = [];
    for (const cat of categoriesWithSubs) {
      cat.subServices.forEach((sub, subIdx) => {
        out.push({
          key: subServiceKey(cat.id, subIdx),
          catId: cat.id,
          subIdx,
          label: sub.name,
          desc: sub.desc ?? "",
          price: sub.price ?? 0,
          qty: typeof sub.qty === "number" && sub.qty > 0 ? sub.qty : 1,
          labourCost: typeof sub.labourCost === "number" ? sub.labourCost : 0,
          categoryName: cat.name,
        });
      });
    }
    return out;
  }, [categoriesWithSubs]);

  const mkLineId = useCallback(() => {
    lineIdRef.current += 1;
    return `svc-line-${lineIdRef.current}`;
  }, []);

  const resetServiceLines = useCallback(() => {
    setServiceLines([emptyServiceLine(mkLineId())]);
  }, [mkLineId]);

  const servicesSelectionBackTo = `/(shop-owner)/job-cards/add?backTo=${encodeURIComponent(backTo)}`;

  const openServicesSelection = useOncePress(() => {
    router.push({
      pathname: "/(shop-owner)/services-selection",
      params: { backTo: servicesSelectionBackTo, from: "profile" },
    });
  });

  function promptSelectServicesFromProfile() {
    Alert.alert(
      "No services selected",
      "Select the services your shop offers from Profile before creating a job card.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Select services", onPress: () => openServicesSelection?.() },
      ]
    );
  }

  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  useFocusEffect(
    useCallback(() => {
      setPhase(isEditMode ? "configure" : "customer");
      setSelectedCustomer(null);
      setSelectedVehicle(null);
      setSearch("");
      setExpandedId(null);
      setServiceLines([]);
      setDiscount("");
      setLabourCharge("");
      setTermsNotes("");
      setEditingJobCardId(null);
      setEditingJobCardNo(null);
      setDisplayJobNo("");
      if (!isEditMode) {
        setOdomCurrent("");
      }

      let cancelled = false;
      if (!token || !isOwner) {
        setPageLoading(false);
        return () => {
          cancelled = true;
        };
      }

      setPageLoading(true);
      void (async () => {
        try {
          const formData = await fetchJobCardFormData(token);
          if (cancelled) return;

          const parsedCustomers = formData.myCustomers.map(mapPageDetailsCustomer);
          setCustomers(parsedCustomers);
          setServiceDeals(formData.serviceDeals ?? []);
          setCategories(
            formData.myServices.map((c) => ({
              id: c.id,
              name: c.name,
              odoOutRequired: c.odoOutRequired,
              subServices: (c.subServices ?? []).map((s) => ({
                name: s.name,
                desc: s.desc,
                price: s.price,
                qty: s.qty,
                make: s.make,
                model: s.model,
                labourCost: s.labourCost,
                odoOutRequired: s.odoOutRequired,
              })),
            }))
          );

          if (!isEditMode) {
            const displayNo =
              formData.nextJobCardNo?.trim() ||
              formData.nextJobCard?.jobCardId?.trim() ||
              (formData.nextJobCardNumber != null ? String(formData.nextJobCardNumber) : "");
            if (displayNo) setDisplayJobNo(displayNo);
          }

          if (isEditMode && typeof params.jobCard === "string") {
            try {
              const raw = JSON.parse(decodeURIComponent(params.jobCard)) as ApiJobCard & {
                jobCardNo?: number | string;
                jobNo?: number | string;
              };
              if (typeof raw._id === "string" && raw._id) {
                setEditingJobCardId(raw._id);
              }
              const jobNo = raw.jobCardNo ?? raw.jobNo;
              if (jobNo != null) {
                setEditingJobCardNo(jobNo);
                setDisplayJobNo(String(jobNo));
              }
              const customerId =
                typeof raw.customerId === "object"
                  ? raw.customerId?._id?.trim()
                  : typeof (raw as { customerId?: string }).customerId === "string"
                    ? String((raw as { customerId?: string }).customerId).trim()
                    : undefined;
              const vehicleId =
                typeof raw.vehicleId === "object"
                  ? raw.vehicleId?._id?.trim()
                  : typeof (raw as { vehicleId?: string }).vehicleId === "string"
                    ? String((raw as { vehicleId?: string }).vehicleId).trim()
                    : undefined;
              const matchedCustomer =
                parsedCustomers.find((c) => customerId && customerKey(c) === customerId) ??
                (raw.customerId && typeof raw.customerId === "object"
                  ? ({
                    _id: raw.customerId._id,
                    name: raw.customerId.name,
                    email: raw.customerId.email,
                    phone: raw.customerId.phone,
                    vehicles: [],
                  } as MyCustomer)
                  : null);
              if (matchedCustomer) {
                setSelectedCustomer(matchedCustomer);
              }
              const matchedVehicle =
                (matchedCustomer?.vehicles ?? []).find((v) => vehicleId && vehicleApiId(v) === vehicleId) ??
                (raw.vehicleId && typeof raw.vehicleId === "object"
                  ? ({
                    _id: raw.vehicleId._id,
                    licensePlateNo: raw.vehicleId.licensePlateNo,
                    vehicleName: raw.vehicleId.vehicleName || raw.vehicleId.make?.name,
                    model: raw.vehicleId.model || raw.vehicleId.make?.model,
                    odometerReading:
                      raw.vehicleId.odometerReading != null
                        ? String(raw.vehicleId.odometerReading)
                        : undefined,
                  } as CustomerVehicle)
                  : null);
              if (matchedVehicle) {
                setSelectedVehicle(matchedVehicle);
              }
              setOdomCurrent(String(raw.odometerReading ?? raw.odoIn ?? matchedVehicle?.odometerReading ?? "0"));
              setDiscount(String(raw.otherCharges ?? raw.discount ?? ""));
              setLabourCharge(String(raw.labourCharge ?? ""));
              setTermsNotes(extractTermsNotes(raw));
            } catch {
              showToastRef.current("Could not open job card in edit mode.", { type: "error" });
            }
          }
        } catch (err) {
          if (!cancelled) {
            const msg = err instanceof Error ? err.message : "Could not load job card form data.";
            showToastRef.current(msg, { type: "error" });
            setCustomers([]);
            setCategories([]);
          }
        } finally {
          if (!cancelled) {
            setPageLoading(false);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [token, isOwner, isEditMode, params.jobCard])
  );

  const vid = selectedVehicle ? vehicleApiId(selectedVehicle) : undefined;
  useEffect(() => {
    if (!selectedVehicle || !vid || isEditMode) {
      return;
    }
    const cur = selectedVehicle.odometerReading?.trim() ?? "0";
    setOdomCurrent(cur);
  }, [vid, selectedVehicle, isEditMode]);

  useEffect(() => {
    if (!isEditMode || typeof params.jobCard !== "string" || allCategoriesWithSubs.length === 0) {
      return;
    }
    try {
      const raw = JSON.parse(decodeURIComponent(params.jobCard)) as ApiJobCard &
        Record<string, unknown>;
      const dueOdo = String(raw.dueOdometerReading ?? raw.odoOut ?? "");
      const normalizedBlocks = normalizeJobCardServiceBlocks(raw as Record<string, unknown>);
      const catsForMatch =
        categoriesWithSubs.length > 0 ? categoriesWithSubs : allCategoriesWithSubs;
      let lines = apiServiceBlocksToLines(normalizedBlocks, catsForMatch, dueOdo);
      if (lines.length === 0 && categoriesWithSubs.length > 0) {
        lines = apiServiceBlocksToLines(normalizedBlocks, allCategoriesWithSubs, dueOdo);
      }
      setServiceLines(
        (lines.length > 0 ? lines : [emptyServiceLine(mkLineId())]).map((line) => ({
          ...line,
          id: mkLineId(),
        }))
      );
      const labourFromJob = String(raw.labourCharge ?? "").trim();
      if (labourFromJob && parseAmount(labourFromJob) > 0) {
        setLabourCharge(labourFromJob);
      } else {
        const fromLines = lines.reduce((sum, line) => sum + parseAmount(line.labourCostStr), 0);
        if (fromLines > 0) setLabourCharge(String(fromLines));
      }
      const savedDealDiscount = extractEstimateDiscount(raw as Record<string, unknown>);
      setDiscount(
        savedDealDiscount > 0
          ? String(savedDealDiscount)
          : String(raw.otherCharges ?? raw.discount ?? ""),
      );
      setTermsNotes(extractTermsNotes(raw));
      if (String(raw.odometerReading ?? raw.odoIn ?? "").trim()) {
        setOdomCurrent(String(raw.odometerReading ?? raw.odoIn ?? "0"));
      }
    } catch {
      // ignore malformed payload
    }
  }, [isEditMode, params.jobCard, allCategoriesWithSubs, categoriesWithSubs, mkLineId]);

  const searchLower = search.trim().toLowerCase();

  const visibleCustomers = useMemo(() => {
    if (!searchLower) {
      return customers;
    }
    return customers.filter((c) => {
      if (customerSearchHay(c).includes(searchLower)) {
        return true;
      }
      return (c.vehicles ?? []).some((v) => vehicleSearchHay(v).includes(searchLower));
    });
  }, [customers, searchLower]);

  const activeLines = useMemo(() => serviceLines.filter((line) => Boolean(line.subKey)), [serviceLines]);

  const partsSubTotal = useMemo(() => {
    let sum = 0;
    for (const line of activeLines) {
      sum += calcLineAmount(line);
    }
    return sum;
  }, [activeLines]);

  const dealDiscountTotal = useMemo(() => {
    let sum = 0;
    for (const line of activeLines) {
      sum += lineDealDiscount(line, categoriesWithSubs, serviceDeals);
    }
    return sum;
  }, [activeLines, categoriesWithSubs, serviceDeals]);

  const labourFromLines = useMemo(() => {
    let sum = 0;
    for (const line of activeLines) {
      sum += parseAmount(line.labourCostStr);
    }
    return sum;
  }, [activeLines]);

  // Match web: keep Labour total in sync with included sub-service labour costs.
  useEffect(() => {
    if (labourFromLines <= 0) return;
    setLabourCharge((prev) => {
      const next = String(labourFromLines);
      return prev === next ? prev : next;
    });
  }, [labourFromLines]);

  const labourAmount = parseAmount(labourCharge);
  const manualDiscountAmount = dealDiscountTotal > 0 ? 0 : parseAmount(discount);
  const discountAmount = dealDiscountTotal > 0 ? dealDiscountTotal : manualDiscountAmount;
  const grandTotal = partsSubTotal + labourAmount - discountAmount;

  const optionByKey = useMemo(() => {
    const map = new Map<string, SubServiceOption>();
    for (const opt of subServiceOptions) {
      map.set(opt.key, opt);
    }
    return map;
  }, [subServiceOptions]);

  useEffect(() => {
    // Auto-expand the first category only once after load.
    // Don't re-open it when the user intentionally collapses everything.
    if (didAutoExpandServiceCatRef.current) return;
    if (expandedServiceCatId) return;
    if (categoriesWithSubs.length === 0) return;
    setExpandedServiceCatId(categoriesWithSubs[0]?.id ?? null);
    didAutoExpandServiceCatRef.current = true;
  }, [categoriesWithSubs, expandedServiceCatId]);

  useEffect(() => {
    // If the expanded category disappears (services list changed), collapse safely.
    if (!expandedServiceCatId) return;
    const stillExists = categoriesWithSubs.some((c) => c.id === expandedServiceCatId);
    if (!stillExists) {
      setExpandedServiceCatId(null);
    }
  }, [categoriesWithSubs, expandedServiceCatId]);

  const linesBySubKey = useMemo(() => {
    const map = new Map<string, ServiceLine>();
    for (const line of serviceLines) {
      if (line.subKey) {
        map.set(line.subKey, line);
      }
    }
    return map;
  }, [serviceLines]);

  const subTotalsByCatId = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of activeLines) {
      const parsed = parseSubServiceKey(line.subKey!);
      if (!parsed) {
        continue;
      }
      map.set(parsed.catId, (map.get(parsed.catId) ?? 0) + calcLineAmount(line));
    }
    return map;
  }, [activeLines]);

  function toggleIncludeSubService(catId: string, subIdx: number) {
    const key = subServiceKey(catId, subIdx);
    const opt = optionByKey.get(key);
    if (!opt) return;

    setServiceLines((prev) => {
      const existing = prev.find((l) => l.subKey === key);
      if (existing) {
        const next = prev.filter((l) => l.id !== existing.id);
        return next.length > 0 ? next : [emptyServiceLine(mkLineId())];
      }
      const nextLine = defaultLineForSub(
        mkLineId(),
        catId,
        subIdx,
        {
          desc: opt.desc,
          price: opt.price,
          qty: opt.qty,
          labourCost: opt.labourCost,
        },
        categoriesWithSubs,
        selectedVehicle
      );
      const base = prev.length === 1 && !prev[0]?.subKey ? [] : prev;
      return [...base, nextLine];
    });
  }

  function updateServiceLine(
    lineId: string,
    patch: Partial<Pick<ServiceLine, "desc" | "unitPriceStr" | "qtyStr" | "odoOutStr">>
  ) {
    setServiceLines((prev) =>
      prev.map((line) => {
        if (line.id !== lineId) {
          return line;
        }
        const next = { ...line, ...patch };
        if ("unitPriceStr" in patch || "qtyStr" in patch) {
          next.priceStr = priceStrFromLine(next);
        }
        return next;
      })
    );
  }

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function beginJobCardForVehicle(customer: MyCustomer, vehicle: CustomerVehicle) {
    const id = vehicleApiId(vehicle);
    if (!id) {
      showToast("This vehicle has no id yet. Edit the customer and save vehicles.", { type: "error" });
      return;
    }
    if (vehicle.disabled) {
      showToast("This vehicle is disabled on the customer's account.", { type: "error" });
      return;
    }
    setSelectedCustomer(customer);
    setSelectedVehicle(vehicle);
    resetServiceLines();
    setPhase("configure");
    setSearch("");
    setExpandedId(null);
  }

  async function submitJobCard() {
    if (!token || !selectedCustomer || !selectedVehicle) {
      return;
    }
    const vehicleId = vehicleApiId(selectedVehicle);
    const ownerId = customerKey(selectedCustomer);
    if (!vehicleId || !ownerId) {
      showToast("Missing customer or vehicle id. Save the vehicle on the customer profile and try again.", {
        type: "error",
      });
      return;
    }

    const blocks = serviceLinesToBlocks(serviceLines, categoriesWithSubs, serviceDeals);

    if (!hasShopServices) {
      promptSelectServicesFromProfile();
      return;
    }

    if (blocks.length === 0) {
      showToast(
        !hasAnySubServices
          ? "Add sub-services under My Services before creating a job card."
          : categoriesWithSubs.length === 0
            ? "No sub-services match this vehicle's make and model."
            : "Select at least one sub-service.",
        { type: "error" }
      );
      return;
    }

    const activeForSave = serviceLines.filter((line) => Boolean(line.subKey));
    const missingOdoOut = activeForSave.some(
      (line) => lineRequiresOdoOut(line, categoriesWithSubs) && parseAmount(line.odoOutStr ?? "") <= 0
    );
    if (missingOdoOut) {
      showToast("Enter odometer out reading for all services that require it.", { type: "error" });
      return;
    }

    const tech = buildLabourTechnicalRemarks(
      labourAmount,
      dealDiscountTotal > 0 ? String(dealDiscountTotal) : discount,
      meta?.countryCode
    );

    setSubmitting(true);
    try {
      const categoriesForSave = allCategoriesWithSubs.map((c) => ({
        id: c.id,
        name: c.name,
        odoOutRequired: Boolean(c.odoOutRequired),
        subServices: (c.subServices ?? []).map((s) => ({
          name: s.name,
          desc: s.desc,
          price: typeof s.price === "number" ? s.price : Number(s.price) || 0,
          odoOutRequired: Boolean(s.odoOutRequired),
        })),
      }));
      const res = await saveJobCard(
        token,
        {
          jobCardId: editingJobCardId ?? undefined,
          jobCardNo: editingJobCardNo ?? undefined,
          terms: termsNotes.trim() || undefined,
          sendForApproval: !isEditMode,
          form: {
            customerId: ownerId,
            vehicleId,
            odometerReading: odomCurrent.trim() || "0",
            dueOdometerReading: resolveDueOdometerReading(activeForSave, categoriesWithSubs),
            issueDescription: "Walk-in / scheduled service",
            serviceType: "Repair",
            priorityLevel: "Normal",
            services: blocks,
            labourCharge: labourCharge.trim() || "0",
            labourDuration: "0",
            technicalRemarks: tech,
            discount: dealDiscountTotal > 0 ? String(dealDiscountTotal) : discount,
            additionalNotes: termsNotes.trim(),
          },
          vehiclePhotoFiles: [],
        },
        categoriesForSave
      );
      if (!res.ok) {
        const msg =
          res.data && typeof res.data === "object" && "message" in res.data
            ? String((res.data as { message?: string }).message ?? "")
            : "";
        showToast(msg || `Could not ${editingJobCardId ? "update" : "create"} job card.`, { type: "error" });
        return;
      }
      showToast(`Job card ${editingJobCardId ? "updated" : "created"}.`, { type: "success" });
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(backTo as never);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error.";
      showToast(msg, { type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOwner) {
    return (
      <StackScreenFrame title="Job Card" backgroundColor={colors.bgProfile} backTo={backTo}>
        <Text style={styles.muted}>This screen is for shop owners.</Text>
      </StackScreenFrame>
    );
  }

  return (
    <StackScreenFrame
      title={editingJobCardId ? "Edit Job Card" : "Job Card"}
      backgroundColor={colors.bgProfile}
      backTo={backTo}
      scroll
      contentContainerStyle={{
        paddingBottom: insets.bottom + spacing.md,
      }}
    >
      {phase !== "configure" ? (
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={20} color={colors.primary} />
          <TextInput
            placeholder="Search customer, phone, or vehicle…"
            placeholderTextColor={colors.textLight}
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!pageLoading}
          />
          {pageLoading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        </View>
      ) : null}

      {pageLoading && phase === "configure" ? (
        <View style={styles.listLoading}>
          <LoadingProgress />
        </View>
      ) : null}

      {phase === "customer" ? (
        pageLoading ? (
          <View style={styles.listLoading}>
            <LoadingProgress />
          </View>
        ) : (
          <>
            <View style={styles.countRow}>
              <Ionicons name="people" size={18} color={colors.primary} />
              <Text style={styles.countText}>{visibleCustomers.length} customers found</Text>
            </View>
            {visibleCustomers.map((c) => {
              const id = customerKey(c);
              const rowKey = id || c.name || "row";
              const expanded = (id || rowKey) === expandedId;
              const toggle = () => toggleExpanded(id || rowKey);
              const totalVehicles = c.vehicles?.length ?? 0;
              const vehiclesShown = vehiclesToShowUnderCustomer(c, searchLower);
              const vehiclesEmptyMessage =
                totalVehicles === 0
                  ? undefined
                  : vehiclesShown.length === 0
                    ? "No vehicles match this search."
                    : undefined;
              return (
                <CustomerCard
                  key={rowKey}
                  variant="mine"
                  name={c.name?.trim() || "—"}
                  phone={displayPhone(c)}
                  email={c.email}
                  address={c.address}
                  city={c.city}
                  pincode={c.pincode}
                  vehicles={vehiclesShown}
                  vehiclesEmptyMessage={vehiclesEmptyMessage}
                  expanded={expanded}
                  onToggleExpand={toggle}
                  hideFooter
                  onCreateJobCardForVehicle={(vehicleIndex) => {
                    const v = vehiclesShown[vehicleIndex];
                    if (v) {
                      beginJobCardForVehicle(c, v);
                    }
                  }}
                />
              );
            })}
          </>
        )
      ) : null}

      {!pageLoading && phase === "configure" && selectedCustomer && selectedVehicle ? (
        <>
          <SurfaceCard shadow="card" style={styles.jobSheet}>
            <View style={styles.jobSheetTop}>
              <Text style={styles.jobSheetTitle}>{editingJobCardId ? "Edit Job Card" : "New Job Card"}</Text>
              <View style={styles.jobSheetMeta}>
                {displayJobNo ? (
                  <Text style={styles.jobSheetJobNo} numberOfLines={1}>
                    {displayJobNo}
                  </Text>
                ) : null}
                <Text style={styles.jobSheetDate}>{formatJobCardDate()}</Text>
              </View>
            </View>

            <View style={styles.partyRow}>
              <View style={styles.partyBox}>
                <Text style={styles.partyBoxLabel}>Customer</Text>
                <Text style={styles.partyName} numberOfLines={2}>
                  {selectedCustomer.name ?? "—"}
                </Text>
                <Text style={styles.partyPhone}>{displayPhone(selectedCustomer)}</Text>
                {selectedCustomer.city?.trim() ? (
                  <Text style={styles.partyMeta}>{selectedCustomer.city.trim()}</Text>
                ) : null}
              </View>
              <Pressable
                style={styles.partyBox}
                onPress={() => {
                  // setOpenDropdownLineId((open) => (open === "__vehicle__" ? null : "__vehicle__"))
                }}
              >
                <Text style={styles.partyBoxLabel}>Vehicle</Text>
                <Text style={styles.partyName} numberOfLines={2}>
                  {[selectedVehicle.vehicleName, selectedVehicle.model].filter(Boolean).join(" ") ||
                    vehicleLabel(selectedVehicle)}
                </Text>
                <Text style={styles.partyPlate}>{vehicleLabel(selectedVehicle)}</Text>
                {/* <Ionicons name="chevron-down" size={16} color={colors.primary} style={styles.partyVehicleChevron} /> */}
              </Pressable>
            </View>

            <View style={styles.odoRow}>
              <View style={styles.odoBlock}>
                <Text style={styles.odoLabelIn}>ODO IN</Text>
                <View style={styles.odoValueBox}>
                  <TextInput
                    style={styles.odoInput}
                    keyboardType="number-pad"
                    value={odomCurrent}
                    onChangeText={(t) => setOdomCurrent(t.replace(/\D/g, ""))}
                    placeholder="—"
                    placeholderTextColor={colors.textLight}
                  />
                </View>
              </View>
            </View>
          </SurfaceCard>

          {pageLoading && !hasShopServices ? (
            <View style={styles.servicesLoading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : !hasShopServices ? (
            <SurfaceCard shadow="card" style={styles.emptyCard}>
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="build-outline" size={56} color={colors.textLight} />
                </View>
                <Text style={styles.emptyTitle}>No services selected</Text>
                <Text style={styles.emptySub}>
                  Select the services your shop offers from Profile before creating a job card.
                </Text>
                <Pressable style={styles.emptyCta} onPress={() => openServicesSelection?.()}>
                  <Ionicons name="person-outline" size={18} color={colors.white} />
                  <Text style={styles.emptyCtaText}>Select services from Profile</Text>
                </Pressable>
              </View>
            </SurfaceCard>
          ) : !hasAnySubServices ? (
            <SurfaceCard shadow="card" style={styles.emptyCard}>
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="construct-outline" size={56} color={colors.textLight} />
                </View>
                <Text style={styles.emptyTitle}>No sub-services yet</Text>
                <Text style={styles.emptySub}>
                  Add sub-services under My Services before creating a job card.
                </Text>
                <Pressable
                  style={styles.emptyCta}
                  onPress={() =>
                    router.push({
                      pathname: "/(shop-owner)/services",
                      params: { backTo: servicesSelectionBackTo },
                    })
                  }
                >
                  <Ionicons name="layers-outline" size={18} color={colors.white} />
                  <Text style={styles.emptyCtaText}>Go to My Services</Text>
                </Pressable>
              </View>
            </SurfaceCard>
          ) : categoriesWithSubs.length === 0 ? (
            <SurfaceCard shadow="card" style={styles.emptyCard}>
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="car-outline" size={56} color={colors.textLight} />
                </View>
                <Text style={styles.emptyTitle}>No matching sub-services</Text>
                <Text style={styles.emptySub}>
                  No sub-services match this vehicle's make and model.
                </Text>
              </View>
            </SurfaceCard>
          ) : (
            <View style={styles.servicesCardsWrap}>
              {categoriesWithSubs.map((cat) => {
                const expanded = cat.id === expandedServiceCatId;
                const catSubTotal = subTotalsByCatId.get(cat.id) ?? 0;
                const showOdoOut = Boolean(cat.odoOutRequired);
                const odoPlaceholder = vehicleOdoOutPlaceholder(selectedVehicle);
                return (
                  <View key={cat.id} style={styles.serviceCardOuter}>
                    <ExpandableCard
                      title={cat.name ?? "Service"}
                      headerIcon="build-outline"
                      expanded={expanded}
                      onToggle={() => setExpandedServiceCatId((prev) => (prev === cat.id ? null : cat.id))}
                    >
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={[styles.servicesListPanel, showOdoOut && styles.servicesListPanelWithOdo]}>
                          <View style={styles.servicesTableHead}>
                            <Text style={[styles.servicesTh, styles.colIncl]}>INCL</Text>
                            <Text style={[styles.servicesTh, styles.colService]}>SUB</Text>
                            <Text style={[styles.servicesTh, styles.colDesc]}>DESC</Text>
                            {showOdoOut ? (
                              <Text style={[styles.servicesTh, styles.colOdo]}>ODO OUT</Text>
                            ) : null}
                            <Text style={[styles.servicesTh, styles.colUnit]}>UNIT</Text>
                            <Text style={[styles.servicesTh, styles.colQty]}>QTY</Text>
                            <Text style={[styles.servicesTh, styles.colTotal]}>AMOUNT</Text>
                          </View>

                          {cat.subServices.map((sub, subIdx) => {
                            const key = subServiceKey(cat.id, subIdx);
                            const line = linesBySubKey.get(key);
                            const included = Boolean(line);
                            const lineId = line?.id ?? "";
                            const renderAmountInput = (
                              field: "unitPriceStr" | "qtyStr",
                              value: string,
                              widthStyle: object
                            ) => (
                              <View style={[styles.priceWrap, widthStyle, !included && styles.priceWrapDisabled]}>
                                <TextInput
                                  style={[styles.priceInput, !included && styles.priceInputDisabled]}
                                  keyboardType="decimal-pad"
                                  value={included ? value : ""}
                                  onChangeText={(t) => {
                                    if (!lineId) return;
                                    updateServiceLine(lineId, { [field]: t });
                                  }}
                                  editable={included}
                                  placeholder={field === "qtyStr" ? "1" : "0"}
                                  placeholderTextColor={colors.textLight}
                                  multiline={false}
                                  scrollEnabled={false}
                                  textAlignVertical={Platform.OS === "android" ? "center" : "auto"}
                                  underlineColorAndroid="transparent"
                                />
                              </View>
                            );
                            return (
                              <View key={key} style={styles.servicesDataRow}>
                                <View style={styles.colIncl}>
                                  <Pressable
                                    style={[styles.inclBtn, included ? styles.inclBtnOn : styles.inclBtnOff]}
                                    onPress={() => toggleIncludeSubService(cat.id, subIdx)}
                                    hitSlop={6}
                                  >
                                    <Text style={styles.inclBtnText}>{included ? "Y" : "X"}</Text>
                                  </Pressable>
                                </View>

                                <View style={styles.colService}>
                                  <Text style={styles.subServiceNameCell} numberOfLines={2}>
                                    {sub.name}
                                  </Text>
                                </View>

                                <View style={styles.colDesc}>
                                  <TextInput
                                    style={[styles.subServiceDescInline, !included && styles.subServiceDescCellDisabled]}
                                    placeholder="Description"
                                    placeholderTextColor={colors.textLight}
                                    value={line?.desc ?? (sub.desc ?? "")}
                                    onChangeText={(t) => {
                                      if (!lineId) return;
                                      updateServiceLine(lineId, { desc: t });
                                    }}
                                    editable={included}
                                    multiline={false}
                                    scrollEnabled={false}
                                    textAlignVertical={Platform.OS === "android" ? "center" : "auto"}
                                    underlineColorAndroid="transparent"
                                  />
                                </View>

                                {showOdoOut ? (
                                  <View style={styles.colOdo}>
                                    <View style={[styles.priceWrap, styles.colOdo, !included && styles.priceWrapDisabled]}>
                                      <TextInput
                                        style={[styles.priceInput, !included && styles.priceInputDisabled]}
                                        keyboardType="number-pad"
                                        value={included ? line?.odoOutStr ?? "" : ""}
                                        onChangeText={(t) => {
                                          if (!lineId) return;
                                          updateServiceLine(lineId, { odoOutStr: t.replace(/\D/g, "") });
                                        }}
                                        editable={included}
                                        placeholder={odoPlaceholder}
                                        placeholderTextColor={colors.textLight}
                                        multiline={false}
                                        scrollEnabled={false}
                                        textAlignVertical={Platform.OS === "android" ? "center" : "auto"}
                                        underlineColorAndroid="transparent"
                                      />
                                    </View>
                                  </View>
                                ) : null}

                                <View style={styles.colUnit}>
                                  {renderAmountInput(
                                    "unitPriceStr",
                                    line?.unitPriceStr ?? String(sub.price ?? 0),
                                    styles.colUnit
                                  )}
                                </View>
                                <View style={styles.colQty}>
                                  {renderAmountInput("qtyStr", line?.qtyStr ?? "1", styles.colQty)}
                                </View>
                                <View style={styles.colTotal}>
                                  <View style={[styles.priceWrap, styles.colTotal, styles.priceWrapReadOnly, !included && styles.priceWrapDisabled]}>
                                    <Text style={[styles.lineTotalText, !included && styles.priceInputDisabled]}>
                                      {included && line
                                        ? formatCurrencyAmount(calcLineAmount(line), meta?.countryCode, {
                                            fallback: "0",
                                            signSpacing: false,
                                          })
                                        : "—"}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      </ScrollView>

                      <View style={styles.subTotalRow}>
                        <Text style={styles.amountRowLabel}>Sub Total</Text>
                        <Text style={styles.amountRowValue}>
                          {formatCurrencyAmount(catSubTotal, meta?.countryCode, { fallback: "—", signSpacing: true })}
                        </Text>
                      </View>
                    </ExpandableCard>
                  </View>
                );
              })}
            </View>
          )}

          {categoriesWithSubs.length > 0 ? (
            <SurfaceCard shadow="soft" style={styles.totalsCard}>
              <View style={styles.totalsRow}>
                <Text style={styles.amountRowLabel}>Subtotal</Text>
                <Text style={styles.totalsValue}>
                  {formatCurrencyAmount(partsSubTotal, meta?.countryCode, { fallback: "—", signSpacing: true })}
                </Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.amountRowLabel}>Labour</Text>
                <View style={styles.labourInputWrap}>
                  <Text style={styles.labourCurrencySign}>{getCurrencySign(meta?.countryCode)}</Text>
                  <TextInput
                    style={styles.labourInput}
                    keyboardType="decimal-pad"
                    value={labourCharge}
                    onChangeText={(t) => setLabourCharge(t.replace(/[^0-9.]/g, ""))}
                    placeholder="0"
                    placeholderTextColor={colors.textLight}
                  />
                </View>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.amountRowLabel}>Discount</Text>
                {dealDiscountTotal > 0 ? (
                  <Text style={styles.dealDiscountValue}>
                    −
                    {formatCurrencyAmount(dealDiscountTotal, meta?.countryCode, {
                      fallback: "—",
                      signSpacing: true,
                    })}
                  </Text>
                ) : (
                  <View style={styles.labourInputWrap}>
                    <Text style={styles.labourCurrencySign}>{getCurrencySign(meta?.countryCode)}</Text>
                    <TextInput
                      style={styles.labourInput}
                      keyboardType="decimal-pad"
                      value={discount}
                      onChangeText={(t) => setDiscount(t.replace(/[^0-9.]/g, ""))}
                      placeholder="0"
                      placeholderTextColor={colors.textLight}
                    />
                  </View>
                )}
              </View>
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>Total</Text>
                <Text style={styles.amountRowValue}>
                  {formatCurrencyAmount(grandTotal, meta?.countryCode, {
                    fallback: "—",
                    signSpacing: true,
                  })}
                </Text>
              </View>
            </SurfaceCard>
          ) : null}

          <SurfaceCard shadow="soft" style={styles.notesCard}>
            <View style={styles.sectionHead}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Terms</Text>
            </View>
            <TextInput
              style={styles.notesInput}
              value={termsNotes}
              onChangeText={setTermsNotes}
              placeholder="Enter terms and conditions"
              placeholderTextColor={colors.textLight}
              multiline
              textAlignVertical="top"
              maxLength={1200}
            />
          </SurfaceCard>

          <View style={styles.actionRow}>
            <Pressable
              style={[
                styles.saveBtn,
                (submitting || !hasShopServices || categoriesWithSubs.length === 0) && styles.actionBtnDisabled,
              ]}
              disabled={submitting || !hasShopServices || categoriesWithSubs.length === 0}
              onPress={() => void submitJobCard()}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveBtnText}>{editingJobCardId ? "Update" : "Save and Send"}</Text>
              )}
            </Pressable>
            <Pressable
              style={[styles.sendBtn, submitting && styles.actionBtnDisabled]}
              disabled={submitting}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace(backTo as never);
                }
              }}
            >
              <Text style={styles.sendBtnText}>Cancel</Text>
            </Pressable>
          </View>

        </>
      ) : null}

    </StackScreenFrame>
  );
}

const styles = StyleSheet.create({
  listLoading: { paddingVertical: spacing.xl * 2, alignItems: "center", gap: spacing.sm },
  loadingHint: { color: colors.textMuted, fontSize: fontSizes.sm },
  muted: {
    ...typography.cardTitle,
    fontWeight: "400",
    color: colors.textMuted,
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
  },
  servicesLoading: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
  },
  emptyCard: {
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyIcon: { marginBottom: spacing.xs },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "900",
    color: colors.textMuted,
    textAlign: "center",
  },
  emptySub: {
    fontSize: fontSizes.sm,
    fontWeight: "700",
    color: colors.textLight,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  emptyCta: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.round,
    backgroundColor: colors.primary,
  },
  emptyCtaText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: "800",
  },
  searchWrap: {
    minHeight: 44,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryMutedBg,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  jobSheet: {
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  jobSheetTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  jobSheetTitle: { fontSize: fontSizes.lg, fontWeight: "800", color: colors.primary },
  jobSheetMeta: { alignItems: "flex-end", gap: 2, minWidth: 0, flexShrink: 1 },
  jobSheetJobNo: { fontSize: fontSizes.sm, fontWeight: "800", color: colors.primary },
  jobSheetDate: { fontSize: fontSizes.sm, fontWeight: "600", color: colors.textMuted },
  partyRow: { flexDirection: "row", gap: spacing.sm },
  partyBox: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    minHeight: 92,
  },
  partyBoxLabel: {
    alignSelf: "center",
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  partyName: { fontSize: fontSizes.sm, fontWeight: "800", color: colors.text, textAlign: "center" },
  partyPhone: { fontSize: fontSizes.sm, fontWeight: "700", color: colors.primary, textAlign: "center", marginTop: 2 },
  partyMeta: { fontSize: 11, color: colors.textMuted, textAlign: "center", marginTop: 2 },
  partyPlate: { fontSize: fontSizes.sm, fontWeight: "700", color: colors.primary, textAlign: "center", marginTop: 2 },
  partyVehicleChevron: { alignSelf: "center", marginTop: 4 },
  vehicleDropdown: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "100%",
    marginTop: 4,
    zIndex: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    ...shadows.soft,
  },
  vehicleDropdownItem: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  vehicleDropdownItemActive: { backgroundColor: colors.primaryMutedBg },
  vehicleDropdownText: { fontSize: fontSizes.sm, fontWeight: "600", color: colors.text },
  vehicleDropdownTextActive: { color: colors.primary, fontWeight: "800" },
  odoRow: { flexDirection: "row", gap: spacing.sm },
  odoBlock: { flex: 1, minWidth: 0, gap: spacing.xs },
  odoLabelIn: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  odoValueBox: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  odoInput: {
    width: "100%",
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    paddingVertical: 0,
  },
  servicesCardsWrap: {
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  serviceCardOuter: {
    ...shadows.soft,
  },
  servicesListPanel: {
    backgroundColor: colors.primaryMutedBg,
    borderRadius: radii.md,
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 0,
    minWidth: 460,
  },
  servicesListPanelWithOdo: { minWidth: 540 },
  servicesTableHead: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryMutedBg,
    borderRadius: radii.sm,
    paddingVertical: 4,
    paddingHorizontal: 6,
    gap: 6,
  },
  servicesTh: { fontSize: 10, fontWeight: "800", color: colors.primary, letterSpacing: 0.3 },
  servicesDataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    minHeight: 32,
  },
  colService: { width: 72, justifyContent: "center" },
  colDesc: { width: 120, justifyContent: "center" },
  colOdo: { width: 72, justifyContent: "center" },
  colUnit: { width: 88, justifyContent: "center" },
  colQty: { width: 52, justifyContent: "center" },
  colTotal: { width: 88, justifyContent: "center" },
  colIncl: { width: 44, alignItems: "center", justifyContent: "center" },
  priceWrapReadOnly: { backgroundColor: colors.bgAlt },
  lineTotalText: {
    flex: 1,
    fontSize: fontSizes.xs,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "right",
    paddingHorizontal: 6,
    alignSelf: "center",
  },
  subServiceNameCell: { fontSize: fontSizes.sm, fontWeight: "800", color: colors.text },
  subServiceDescInline: {
    fontSize: fontSizes.xs,
    fontWeight: "600",
    color: colors.text,
    paddingVertical: Platform.OS === "android" ? 0 : 2,
    margin: 0,
    minHeight: 28,
    maxHeight: 28,
  },
  subServiceDescCellDisabled: { opacity: 0.55 },
  inclBtn: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  inclBtnOff: { backgroundColor: colors.danger },
  inclBtnOn: { backgroundColor: colors.success },
  inclBtnText: { color: colors.white, fontSize: fontSizes.sm, fontWeight: "900" },
  serviceDescInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.bgAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: fontSizes.sm,
    color: colors.text,
    minHeight: 36,
  },
  priceWrap: {
    flexDirection: "row",
    alignItems: "stretch",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.primaryMutedBg,
    overflow: "hidden",
    height: 30,
  },
  priceWrapDisabled: { backgroundColor: colors.bgAlt, opacity: 0.85 },
  priceInput: {
    flex: 1,
    minWidth: 0,
    height: 30,
    paddingVertical: 0,
    paddingHorizontal: 6,
    fontSize: fontSizes.sm,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "right",
    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
  },
  priceInputDisabled: { color: colors.textLight },
  subTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  amountRowLabel: { fontSize: fontSizes.md, fontWeight: "800", color: colors.text },
  amountRowValue: { fontSize: fontSizes.xl, fontWeight: "800", color: colors.primary },
  notesCard: {
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    minHeight: 96,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.text,
  },
  totalsCard: {
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  totalsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  totalsValue: { fontSize: fontSizes.md, fontWeight: "800", color: colors.text },
  dealDiscountValue: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: "#047857",
  },
  labourInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 112,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
  },
  labourCurrencySign: {
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.primary,
    marginRight: 2,
  },
  labourInput: {
    flex: 1,
    minWidth: 64,
    paddingVertical: spacing.xs,
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "right",
  },
  discountInput: {
    minWidth: 96,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: fontSizes.md,
    fontWeight: "700",
    color: colors.text,
    textAlign: "right",
    backgroundColor: colors.white,
  },
  grandTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
  },
  grandTotalLabel: { fontSize: fontSizes.lg, fontWeight: "900", color: colors.text },
  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
  },
  saveBtn: {
    flex: 1,
    minHeight: 48,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radii.round,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft,
  },
  saveBtnText: { color: colors.white, fontSize: fontSizes.lg, fontWeight: "800" },
  sendBtn: {
    flex: 1,
    minHeight: 48,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radii.round,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnText: { color: colors.primary, fontSize: fontSizes.lg, fontWeight: "800" },
  actionBtnDisabled: { opacity: 0.7 },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.screenHorizontal,
  },
  countText: { fontSize: fontSizes.md, fontWeight: "700", color: colors.primary },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  rupee: { fontSize: fontSizes.sm, fontWeight: "700", color: colors.textMuted },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: fontSizes.md, fontWeight: "800", color: colors.text },
});

