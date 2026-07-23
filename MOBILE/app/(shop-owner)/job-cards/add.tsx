import { CustomerCard } from "@/components/customers";
import { ExpandableCard, LoadingProgress, StackScreenFrame, SurfaceCard, useToast } from "@/components/reusables";
import { colors, fontSizes, radii, shadows, spacing, typography } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { customerKey, parseMyCustomersFromApiPayload } from "@/hooks/use-my-customers";
import { useMyShopServices } from "@/hooks/use-my-shop-services";
import { useOncePress } from "@/hooks/use-once-press";
import { fetchAddedCustomers } from "@/lib/autoshopowner-api";
import { MAX_JOB_CARD_VEHICLE_PHOTOS, saveJobCard } from "@/lib/shop-owner-job-cards-api";
import type { UploadPart } from "@/lib/upload-part";
import { formatCurrencyAmount } from "@/lib/currency";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import { Image } from "expo-image";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
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
  labourCostStr: string;
  priceStr: string;
};

type PickedVehiclePhoto = UploadPart;

type SubServiceOption = {
  key: string;
  catId: string;
  subIdx: number;
  label: string;
  desc: string;
  price: number;
  categoryName?: string;
};

type ApiJobCardSubService = {
  name?: string;
  desc?: string;
  price?: number | string;
  unitPrice?: number | string;
  qty?: string | number;
  unit?: string | number;
  labourCost?: number | string;
  labourCharge?: number | string;
  labourDuration?: string | number;
};

type ApiJobCard = {
  _id?: string;
  customerId?: { _id?: string; name?: string; email?: string; phone?: string };
  vehicleId?: { _id?: string; licensePlateNo?: string; make?: { name?: string; model?: string } };
  odometerReading?: number | string;
  dueOdometerReading?: number | string;
  otherCharges?: number | string;
  labourCharge?: number | string;
  labourDuration?: string | number;
  discount?: string | number;
  vehiclePhotos?: string[];
  services?: Array<{ service?: string; subServices?: ApiJobCardSubService[] }>;
};

function displayPhone(c: MyCustomer) {
  const cc = c.countryCode?.trim();
  const p = c.phone?.trim();
  if (cc && p) {
    return `${cc} ${p}`;
  }
  return p ?? "";
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

function calcLinePrice(line: Pick<ServiceLine, "unitPriceStr" | "qtyStr" | "labourCostStr">): number {
  const unit = parseAmount(line.unitPriceStr);
  const qty = parseAmount(line.qtyStr);
  const labour = parseAmount(line.labourCostStr);
  return unit * qty + labour;
}

function priceStrFromLine(line: Pick<ServiceLine, "unitPriceStr" | "qtyStr" | "labourCostStr">): string {
  const total = calcLinePrice(line);
  return Number.isFinite(total) ? String(total) : "0";
}

function defaultLineForSub(
  id: string,
  catId: string,
  subIdx: number,
  sub: { desc?: string; price?: number }
): ServiceLine {
  const draft = {
    unitPriceStr: String(sub?.price ?? 0),
    qtyStr: "1",
    labourCostStr: "0",
  };
  return {
    id,
    subKey: subServiceKey(catId, subIdx),
    desc: sub?.desc ?? "",
    ...draft,
    priceStr: priceStrFromLine(draft),
  };
}

function emptyServiceLine(id: string): ServiceLine {
  return { id, subKey: null, desc: "", unitPriceStr: "", qtyStr: "1", labourCostStr: "0", priceStr: "0" };
}

function buildLabourTechnicalRemarks(
  labourSubTotal: number,
  discountStr: string,
  countryCode: string | null | undefined
): string {
  const other = String(discountStr ?? "").trim();
  const otherAmt = parseAmount(other);
  if (labourSubTotal <= 0 && !other) {
    return "";
  }
  const fmt = (x: number) =>
    formatCurrencyAmount(x, countryCode, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      fallback: "",
    });
  const parts: string[] = [];
  if (labourSubTotal > 0) {
    parts.push(fmt(labourSubTotal));
  }
  if (other) {
    parts.push(otherAmt > 0 ? `Discount: ${fmt(otherAmt)}` : `Discount: ${other}`);
  }
  return parts.length ? `Labour: ${parts.join("; ")}` : "";
}

function apiServiceBlocksToLines(
  blocks: ApiJobCard["services"],
  categories: { id: string; subServices: { name: string; desc?: string; price?: number }[] }[]
): ServiceLine[] {
  const lines: ServiceLine[] = [];
  let n = 0;
  for (const block of blocks || []) {
    const catId = String(block.service || "").trim();
    if (!catId) {
      continue;
    }
    const cat = categories.find((c) => c.id === catId);
    if (!cat) {
      continue;
    }
    for (const ss of block.subServices || []) {
      const subName = String(ss.name || "").trim();
      if (!subName) {
        continue;
      }
      const subIdx = cat.subServices.findIndex((s) => s.name === subName);
      if (subIdx < 0) {
        continue;
      }
      const catalogSub = cat.subServices[subIdx];
      const qtyStr = String(ss.qty ?? ss.unit ?? ss.labourDuration ?? "1");
      const labourCostStr = String(ss.labourCost ?? ss.labourCharge ?? "0");
      const qty = parseAmount(qtyStr) || 1;
      const labour = parseAmount(labourCostStr);
      const savedTotal = parseAmount(String(ss.price ?? ""));
      let unitPriceStr = ss.unitPrice != null ? String(ss.unitPrice) : "";
      if (!unitPriceStr && savedTotal > 0 && qty > 0) {
        unitPriceStr = String((savedTotal - labour) / qty);
      } else if (!unitPriceStr) {
        unitPriceStr = String(catalogSub?.price ?? 0);
      }
      n += 1;
      const draft = { unitPriceStr, qtyStr, labourCostStr };
      lines.push({
        id: `line-${n}`,
        subKey: subServiceKey(catId, subIdx),
        desc: ss.desc ?? "",
        ...draft,
        priceStr: priceStrFromLine(draft),
      });
    }
  }
  return lines;
}

function serviceLinesToBlocks(
  lines: ServiceLine[],
  categories: { id: string; subServices: { name: string; desc?: string }[] }[]
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
    const labourCost = parseAmount(line.labourCostStr);
    const unitPrice = parseAmount(line.unitPriceStr);
    bucket.push({
      name: sub.name,
      desc: String(line.desc || "").trim(),
      unit: qty,
      qty,
      unitPrice,
      price: calcLinePrice(line),
      labourCharge: labourCost,
      labourCost,
    });
    map.set(parsed.catId, bucket);
  }
  return [...map.entries()].map(([service, subServices]) => ({ service, subServices }));
}

function extractJobCardPhotoPaths(raw: ApiJobCard): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw.vehiclePhotos ?? []) {
    const path = String(item ?? "").trim();
    if (!path || seen.has(path)) {
      continue;
    }
    seen.add(path);
    out.push(path);
  }
  return out;
}

function formatJobCardDate(d = new Date()): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
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

  const { categories, loading: servicesLoading, load: loadServices } = useMyShopServices(token, isOwner, showToast);

  const [pageLoading, setPageLoading] = useState(true);
  const [customers, setCustomers] = useState<MyCustomer[]>([]);
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
  const [odomDue, setOdomDue] = useState("");
  const [discount, setDiscount] = useState("");
  const [newVehiclePhotos, setNewVehiclePhotos] = useState<PickedVehiclePhoto[]>([]);
  const [keptVehiclePhotoUrls, setKeptVehiclePhotoUrls] = useState<string[]>([]);
  const [editingJobCardId, setEditingJobCardId] = useState<string | null>(null);
  const [editingJobCardNo, setEditingJobCardNo] = useState<string | number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const categoriesWithSubs = useMemo(() => categories.filter((c) => c.subServices.length > 0), [categories]);
  const hasShopServices = categories.length > 0;

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

  useFocusEffect(
    useCallback(() => {
      setPhase(isEditMode ? "configure" : "customer");
      setSelectedCustomer(null);
      setSelectedVehicle(null);
      setSearch("");
      setExpandedId(null);
      setServiceLines([]);
      setDiscount("");
      setNewVehiclePhotos([]);
      setKeptVehiclePhotoUrls([]);
      setEditingJobCardId(null);
      if (!isEditMode) {
        setOdomCurrent("");
        setOdomDue("");
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
          const [custRes] = await Promise.all([fetchAddedCustomers(token, "approved"), loadServices()]);
          if (!cancelled && custRes.ok) {
            const parsedCustomers = parseMyCustomersFromApiPayload(custRes.data);
            setCustomers(parsedCustomers);
            if (isEditMode && typeof params.jobCard === "string") {
              try {
                const raw = JSON.parse(decodeURIComponent(params.jobCard)) as ApiJobCard & {
                  jobCardNo?: number | string;
                };
                if (typeof raw._id === "string" && raw._id) {
                  setEditingJobCardId(raw._id);
                }
                if (raw.jobCardNo != null) {
                  setEditingJobCardNo(raw.jobCardNo);
                }
                const customerId = raw.customerId?._id?.trim();
                const vehicleId = raw.vehicleId?._id?.trim();
                const matchedCustomer =
                  parsedCustomers.find((c) => customerId && customerKey(c) === customerId) ??
                  (raw.customerId
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
                  (raw.vehicleId
                    ? ({
                      _id: raw.vehicleId._id,
                      licensePlateNo: raw.vehicleId.licensePlateNo,
                      vehicleName: raw.vehicleId.make?.name,
                      model: raw.vehicleId.make?.model,
                    } as CustomerVehicle)
                    : null);
                if (matchedVehicle) {
                  setSelectedVehicle(matchedVehicle);
                }
                setOdomCurrent(String(raw.odometerReading ?? "0"));
                setOdomDue(String(raw.dueOdometerReading ?? "0"));
                setDiscount(String(raw.otherCharges ?? raw.labourDuration ?? ""));
                setKeptVehiclePhotoUrls(extractJobCardPhotoPaths(raw));
                setNewVehiclePhotos([]);
              } catch {
                showToast("Could not open job card in edit mode.", { type: "error" });
              }
            }
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
    }, [token, isOwner, loadServices, isEditMode, params.jobCard, showToast])
  );

  const vid = selectedVehicle ? vehicleApiId(selectedVehicle) : undefined;
  useEffect(() => {
    if (!selectedVehicle || !vid) {
      return;
    }
    const cur = selectedVehicle.odometerReading?.trim() ?? "0";
    setOdomCurrent(cur);
    const curN = parseAmount(cur);
    setOdomDue(String(Number.isFinite(curN) ? curN + 500 : 500));
  }, [vid, selectedVehicle]);

  useEffect(() => {
    if (!isEditMode || typeof params.jobCard !== "string" || categoriesWithSubs.length === 0) {
      return;
    }
    try {
      const raw = JSON.parse(decodeURIComponent(params.jobCard)) as ApiJobCard;
      const lines = apiServiceBlocksToLines(raw.services, categoriesWithSubs).map((line) => ({
        ...line,
        id: mkLineId(),
      }));
      setServiceLines(lines.length > 0 ? lines : [emptyServiceLine(mkLineId())]);
      setDiscount(String(raw.otherCharges ?? raw.labourDuration ?? ""));
      setKeptVehiclePhotoUrls(extractJobCardPhotoPaths(raw));
      setNewVehiclePhotos([]);
    } catch {
      // ignore malformed payload
    }
  }, [isEditMode, params.jobCard, categoriesWithSubs, mkLineId]);

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
      sum += parseAmount(line.unitPriceStr) * parseAmount(line.qtyStr);
    }
    return sum;
  }, [activeLines]);

  const labourSubTotal = useMemo(() => {
    let sum = 0;
    for (const line of activeLines) {
      sum += parseAmount(line.labourCostStr);
    }
    return sum;
  }, [activeLines]);

  const discountAmount = parseAmount(discount);
  const grandTotal = partsSubTotal + labourSubTotal - discountAmount;
  const totalPhotoCount = keptVehiclePhotoUrls.length + newVehiclePhotos.length;
  const canAddMorePhotos = totalPhotoCount < MAX_JOB_CARD_VEHICLE_PHOTOS;

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
      map.set(parsed.catId, (map.get(parsed.catId) ?? 0) + calcLinePrice(line));
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
      const nextLine = defaultLineForSub(mkLineId(), catId, subIdx, {
        desc: opt.desc,
        price: opt.price,
      });
      const base = prev.length === 1 && !prev[0]?.subKey ? [] : prev;
      return [...base, nextLine];
    });
  }

  function updateServiceLine(
    lineId: string,
    patch: Partial<Pick<ServiceLine, "desc" | "unitPriceStr" | "qtyStr" | "labourCostStr">>
  ) {
    setServiceLines((prev) =>
      prev.map((line) => {
        if (line.id !== lineId) {
          return line;
        }
        const next = { ...line, ...patch };
        if ("unitPriceStr" in patch || "qtyStr" in patch || "labourCostStr" in patch) {
          next.priceStr = priceStrFromLine(next);
        }
        return next;
      })
    );
  }

  async function pickVehiclePhotos() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast("Photo library permission is required.", { type: "error" });
      return;
    }
    const room = MAX_JOB_CARD_VEHICLE_PHOTOS - totalPhotoCount;
    if (room <= 0) {
      showToast(`Maximum ${MAX_JOB_CARD_VEHICLE_PHOTOS} images allowed.`, { type: "error" });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: room,
      quality: 0.85,
    });
    if (result.canceled) {
      return;
    }
    const picked = (result.assets ?? [])
      .filter((a) => a.uri)
      .slice(0, room)
      .map((a) => ({
        uri: a.uri,
        mimeType: a.mimeType,
        fileName: a.fileName,
      }));
    if (picked.length) {
      setNewVehiclePhotos((prev) => {
        const maxNew = MAX_JOB_CARD_VEHICLE_PHOTOS - keptVehiclePhotoUrls.length;
        return [...prev, ...picked].slice(0, maxNew);
      });
    }
  }

  function removeNewVehiclePhoto(index: number) {
    setNewVehiclePhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function removeKeptVehiclePhoto(index: number) {
    setKeptVehiclePhotoUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function collectVehiclePhotosForUpload(): Promise<UploadPart[]> {
    if (!token) {
      return [...newVehiclePhotos];
    }
    const out: UploadPart[] = [];
    for (let i = 0; i < keptVehiclePhotoUrls.length; i++) {
      if (out.length >= MAX_JOB_CARD_VEHICLE_PHOTOS) {
        break;
      }
      const absolute = normalizeMediaUrl(keptVehiclePhotoUrls[i]);
      if (!absolute || absolute.startsWith("file:") || absolute.startsWith("content:")) {
        out.push({ uri: absolute ?? keptVehiclePhotoUrls[i] });
        continue;
      }
      try {
        const dest = `${FileSystem.cacheDirectory ?? ""}jc-photo-${Date.now()}-${i}.jpg`;
        const downloaded = await FileSystem.downloadAsync(absolute, dest, {
          headers: { Authorization: token },
        });
        if (downloaded.status === 200 && downloaded.uri) {
          out.push({ uri: downloaded.uri, name: `vehicle-photo-${i + 1}.jpg` });
        }
      } catch {
        // skip failed re-upload of existing photo
      }
    }
    for (const photo of newVehiclePhotos) {
      if (out.length >= MAX_JOB_CARD_VEHICLE_PHOTOS) {
        break;
      }
      out.push(photo);
    }
    return out.slice(0, MAX_JOB_CARD_VEHICLE_PHOTOS);
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

    const blocks = serviceLinesToBlocks(serviceLines, categoriesWithSubs);

    if (!hasShopServices) {
      promptSelectServicesFromProfile();
      return;
    }

    if (blocks.length === 0) {
      showToast(
        categoriesWithSubs.length === 0
          ? "Add sub-services under My Services before creating a job card."
          : "Select at least one sub-service.",
        { type: "error" }
      );
      return;
    }

    const tech = buildLabourTechnicalRemarks(labourSubTotal, discount, meta?.countryCode);
    const vehiclePhotos = await collectVehiclePhotosForUpload();

    setSubmitting(true);
    try {
      const categoriesForSave = categoriesWithSubs.map((c) => ({
        id: c.id,
        name: c.name,
        subServices: (c.subServices ?? []).map((s) => ({
          name: s.name,
          desc: s.desc,
          price: typeof s.price === "number" ? s.price : Number(s.price) || 0,
        })),
      }));
      const res = await saveJobCard(
        token,
        {
          jobCardId: editingJobCardId ?? undefined,
          jobCardNo: editingJobCardNo ?? undefined,
          sendForApproval: !isEditMode,
          form: {
            customerId: ownerId,
            vehicleId,
            odometerReading: odomCurrent.trim() || "0",
            dueOdometerReading: odomDue.trim() || "0",
            issueDescription: "Walk-in / scheduled service",
            serviceType: "Repair",
            priorityLevel: "Normal",
            services: blocks,
            labourCharge: "0",
            labourDuration: "0",
            technicalRemarks: tech,
            discount,
            additionalNotes: "",
          },
          vehiclePhotoFiles: vehiclePhotos,
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
              <Text style={styles.jobSheetDate}>{formatJobCardDate()}</Text>
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
              <View style={styles.odoBlock}>
                <Text style={styles.odoLabelOut}>ODO OUT</Text>
                <View style={styles.odoValueBox}>
                  <TextInput
                    style={styles.odoInput}
                    keyboardType="number-pad"
                    value={odomDue}
                    onChangeText={(t) => setOdomDue(t.replace(/\D/g, ""))}
                    placeholder="—"
                    placeholderTextColor={colors.textLight}
                  />
                </View>
              </View>
            </View>
          </SurfaceCard>

          {servicesLoading && !hasShopServices ? (
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
          ) : categoriesWithSubs.length === 0 ? (
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
          ) : (
            <View style={styles.servicesCardsWrap}>
              {categoriesWithSubs.map((cat) => {
                const expanded = cat.id === expandedServiceCatId;
                const catSubTotal = subTotalsByCatId.get(cat.id) ?? 0;
                return (
                  <View key={cat.id} style={styles.serviceCardOuter}>
                    <ExpandableCard
                      title={cat.name ?? "Service"}
                      headerIcon="build-outline"
                      expanded={expanded}
                      onToggle={() => setExpandedServiceCatId((prev) => (prev === cat.id ? null : cat.id))}
                    >
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.servicesListPanel}>
                          <View style={styles.servicesTableHead}>
                            <Text style={[styles.servicesTh, styles.colIncl]}>INCL</Text>
                            <Text style={[styles.servicesTh, styles.colService]}>SUB</Text>
                            <Text style={[styles.servicesTh, styles.colDesc]}>DESC</Text>
                            <Text style={[styles.servicesTh, styles.colUnit]}>UNIT</Text>
                            <Text style={[styles.servicesTh, styles.colQty]}>QTY</Text>
                            <Text style={[styles.servicesTh, styles.colLabour]}>LAB</Text>
                            <Text style={[styles.servicesTh, styles.colTotal]}>PRICE</Text>
                          </View>

                          {cat.subServices.map((sub, subIdx) => {
                            const key = subServiceKey(cat.id, subIdx);
                            const line = linesBySubKey.get(key);
                            const included = Boolean(line);
                            const lineId = line?.id ?? "";
                            const renderAmountInput = (
                              field: "unitPriceStr" | "qtyStr" | "labourCostStr",
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
                                <View style={styles.colLabour}>
                                  {renderAmountInput("labourCostStr", line?.labourCostStr ?? "0", styles.colLabour)}
                                </View>
                                <View style={styles.colTotal}>
                                  <View style={[styles.priceWrap, styles.colTotal, styles.priceWrapReadOnly, !included && styles.priceWrapDisabled]}>
                                    <Text style={[styles.lineTotalText, !included && styles.priceInputDisabled]}>
                                      {included && line
                                        ? formatCurrencyAmount(calcLinePrice(line), meta?.countryCode, {
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

          <SurfaceCard shadow="soft" style={styles.photosCard}>
            <View style={styles.sectionHead}>
              <Ionicons name="images-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Upload images</Text>
            </View>
            <Text style={styles.photosHint}>
              Up to {MAX_JOB_CARD_VEHICLE_PHOTOS} photos ({totalPhotoCount}/{MAX_JOB_CARD_VEHICLE_PHOTOS} selected)
            </Text>
            <Pressable
              style={[styles.uploadPhotosBtn, !canAddMorePhotos && styles.actionBtnDisabled]}
              disabled={!canAddMorePhotos || submitting}
              onPress={() => void pickVehiclePhotos()}
            >
              <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
              <Text style={styles.uploadPhotosBtnText}>Choose images</Text>
            </Pressable>
            {totalPhotoCount > 0 ? (
              <View style={styles.photoThumbRow}>
                {keptVehiclePhotoUrls.map((photo, i) => {
                  const src = normalizeMediaUrl(photo);
                  if (!src) return null;
                  return (
                    <View key={`saved-${i}`} style={styles.photoThumbWrap}>
                      <Image source={{ uri: src }} style={styles.photoThumb} contentFit="cover" />
                      <Pressable style={styles.photoRemoveBtn} onPress={() => removeKeptVehiclePhoto(i)} hitSlop={6}>
                        <Ionicons name="close" size={14} color={colors.white} />
                      </Pressable>
                    </View>
                  );
                })}
                {newVehiclePhotos.map((photo, i) => (
                  <View key={`new-${photo.uri}-${i}`} style={styles.photoThumbWrap}>
                    <Image source={{ uri: photo.uri }} style={styles.photoThumb} contentFit="cover" />
                    <Pressable style={styles.photoRemoveBtn} onPress={() => removeNewVehiclePhoto(i)} hitSlop={6}>
                      <Ionicons name="close" size={14} color={colors.white} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.photosEmpty}>No images yet.</Text>
            )}
          </SurfaceCard>

          {categoriesWithSubs.length > 0 ? (
            <SurfaceCard shadow="soft" style={styles.totalsCard}>
              <View style={styles.totalsRow}>
                <Text style={styles.amountRowLabel}>Subtotal</Text>
                <Text style={styles.totalsValue}>
                  {formatCurrencyAmount(partsSubTotal, meta?.countryCode, { fallback: "—", signSpacing: true })}
                </Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.amountRowLabel}>Labour cost</Text>
                <Text style={styles.totalsValue}>
                  {formatCurrencyAmount(labourSubTotal, meta?.countryCode, { fallback: "—", signSpacing: true })}
                </Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.amountRowLabel}>Discount</Text>
                <TextInput
                  style={styles.discountInput}
                  keyboardType="decimal-pad"
                  value={discount}
                  onChangeText={setDiscount}
                  placeholder="0.00"
                  placeholderTextColor={colors.textLight}
                />
              </View>
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>Total</Text>
                <Text style={styles.amountRowValue}>
                  {formatCurrencyAmount(grandTotal, meta?.countryCode, { fallback: "—", signSpacing: true })}
                </Text>
              </View>
            </SurfaceCard>
          ) : null}

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
  odoLabelOut: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.danger,
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
    minWidth: 560,
  },
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
  colUnit: { width: 88, justifyContent: "center" },
  colQty: { width: 52, justifyContent: "center" },
  colLabour: { width: 88, justifyContent: "center" },
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
  photosCard: {
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  photosHint: { fontSize: fontSizes.xs, color: colors.textMuted, fontWeight: "600" },
  uploadPhotosBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "flex-start",
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  uploadPhotosBtnText: { fontSize: fontSizes.sm, fontWeight: "700", color: colors.primary },
  photoThumbRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
  photoThumbWrap: { position: "relative" },
  photoThumb: { width: 72, height: 56, borderRadius: radii.sm, borderWidth: 1, borderColor: colors.border },
  photoRemoveBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  photosEmpty: { fontSize: fontSizes.xs, color: colors.textMuted, marginTop: spacing.xs },
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

