import {
  ChevronLabelBar,
  Fab,
  LoadingProgress,
  ModalKeyboardRoot,
  StackScreenFrame,
  SurfaceCard,
  useToast,
} from "@/components/reusables";
import { cardFontSizes, cardTypography, colors, fontSizes, radii, shadows, spacing } from "@/constants/autodaddy";
import { useAuth } from "@/context/auth-provider";
import { useShopAccounts, type ShopBankRow, type ShopExpenseRow } from "@/hooks/use-shop-accounts";
import { useShopWallet } from "@/hooks/use-shop-wallet";
import {
  markAutoshopInvoicePaid,
  sendAutoshopJobCardForApproval,
} from "@/lib/autoshopowner-job-cards-api";
import { getAnchoredMenuStyle, type MenuAnchorRect } from "@/lib/anchored-menu-position";
import { formatCurrencyAmount } from "@/lib/currency";
import {
  categoryLabel,
  cloneCategories,
  dedupeLabels,
  EXPENSE_CATEGORIES,
  slugifyLabel,
  type CategoryOption,
} from "@/lib/expense-categories";
import { localImageMultipartPart } from "@/lib/local-image-for-form";
import { androidRefreshScrollProps } from "@/lib/refresh-scroll-props";
import {
  pickJobCardInvoiceNumber,
  pickJobCardNoForApi,
  type JobCardListRow,
} from "@/lib/shop-owner-job-cards";
import type { UploadPart } from "@/lib/upload-part";
import {
  formatWalletAmount,
  pickWalletWhen,
  shortJobBadgeCode,
} from "@/lib/wallet-helpers";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  InteractionManager,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

type WalletSection = "invoices" | "expenses" | "banks";
type InvoiceStatus = "Paid" | "Unpaid";

type InvoiceMenuState = { row: JobCardListRow; isPaid: boolean } | null;
type ExpenseMenuState = { row: ShopExpenseRow } | null;
type BankMenuState = { row: ShopBankRow } | null;

const SECTION_TABS: { id: WalletSection; label: string }[] = [
  { id: "invoices", label: "Invoices" },
  { id: "expenses", label: "Expenses" },
  { id: "banks", label: "Manage Banks" },
];

const STATUS_ORDER: InvoiceStatus[] = ["Paid", "Unpaid"];

function todayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(iso: string) {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return iso;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

function ymdToDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

function dateToYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeVendorLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function displayBillId(row: JobCardListRow): string {
  const invoiceNo = pickJobCardInvoiceNumber(row);
  if (invoiceNo) return invoiceNo;
  return row.jobNo?.trim() || "—";
}

function matchesInvoiceSearch(row: JobCardListRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [row.customerName, row.phone, row.vehiclePlate, row.jobNo, pickJobCardInvoiceNumber(row)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(q);
}

function matchesExpenseSearch(row: ShopExpenseRow, query: string, categories: CategoryOption[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const labels = categoryLabel(categories, row.category, row.subCategory);
  return [
    row.date,
    formatDisplayDate(row.date),
    row.vendor,
    String(row.amount),
    labels.category,
    labels.subcategory,
    row.notes,
    row.billNumber ?? "",
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={styles.fieldLabel}>
      {label}
      {required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}

function FormInput(props: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "decimal-pad" | "numeric";
  multiline?: boolean;
  editable?: boolean;
}) {
  const { value, onChangeText, placeholder, keyboardType = "default", multiline, editable = true } = props;
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textLight}
      keyboardType={keyboardType}
      multiline={multiline}
      editable={editable}
      style={[styles.input, multiline && styles.inputTall, !editable && styles.inputDisabled]}
    />
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Pressable style={styles.checkRow} onPress={() => onChange(!checked)}>
      <Switch
        value={checked}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primaryMutedBg }}
        thumbColor={checked ? colors.primary : colors.textLight}
      />
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

function OptionPickerModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  onEditAddNew,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  onEditAddNew?: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <ModalKeyboardRoot onBackdropPress={onClose} scrimColor="rgba(0,0,0,0.42)">
        <View style={styles.pickerSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>
          <ScrollView style={styles.pickerList} keyboardShouldPersistTaps="handled">
            {options.length === 0 ? (
              <Text style={styles.pickerEmpty}>No options</Text>
            ) : (
              options.map((opt, idx) => {
                const active = opt === selected;
                return (
                  <Pressable
                    key={`${opt}-${idx}`}
                    style={[styles.pickerItem, active && styles.pickerItemActive]}
                    onPress={() => {
                      onSelect(opt);
                      onClose();
                    }}
                  >
                    <Text style={[styles.pickerItemText, active && styles.pickerItemTextActive]}>{opt}</Text>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
          {onEditAddNew ? (
            <Pressable
              style={styles.pickerEditBtn}
              onPress={() => {
                onClose();
                onEditAddNew();
              }}
            >
              <Text style={styles.pickerEditBtnText}>Edit / Add New</Text>
            </Pressable>
          ) : null}
        </View>
      </ModalKeyboardRoot>
    </Modal>
  );
}

function SkeletonLine({ w }: { w: number | `${number}%` }) {
  return <View style={[styles.skeletonLine, { width: w }]} />;
}

function WalletSkeletonList() {
  return (
    <View style={styles.skeletonList} pointerEvents="none">
      {Array.from({ length: 5 }).map((_, i) => (
        <SurfaceCard key={i} shadow="card" style={styles.skeletonCard}>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonBadge} />
            <View style={styles.skeletonTextCol}>
              <SkeletonLine w="56%" />
              <SkeletonLine w="42%" />
              <SkeletonLine w="70%" />
            </View>
            <View style={styles.skeletonRight}>
              <SkeletonLine w={72} />
              <View style={styles.skeletonDot} />
            </View>
          </View>
        </SurfaceCard>
      ))}
    </View>
  );
}

export default function WalletPage() {
  const { token, meta } = useAuth();
  const { showToast } = useToast();
  const { width: windowWidth } = useWindowDimensions();
  const isOwner = (meta?.role ?? "").toLowerCase() === "autoshopowner";
  const countryCode = meta?.countryCode;

  const { paid, unpaid, loading, refresh } = useShopWallet(token, isOwner, showToast);
  const {
    banks,
    expenses,
    loading: accountsLoading,
    refresh: refreshAccounts,
    saveBank,
    saveExpense,
  } = useShopAccounts(token, isOwner, showToast);

  const [section, setSection] = useState<WalletSection>("invoices");
  const [statusIndex, setStatusIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [previewRow, setPreviewRow] = useState<JobCardListRow | null>(null);

  const menuBtnRefs = useRef<Record<string, View | null>>({});
  const [invoiceMenu, setInvoiceMenu] = useState<InvoiceMenuState>(null);
  const [expenseMenu, setExpenseMenu] = useState<ExpenseMenuState>(null);
  const [bankMenu, setBankMenu] = useState<BankMenuState>(null);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchorRect | null>(null);

  const [expenseCategories, setExpenseCategories] = useState<CategoryOption[]>(() =>
    cloneCategories(EXPENSE_CATEGORIES)
  );
  const effectiveCategories =
    expenseCategories.length > 0 ? expenseCategories : EXPENSE_CATEGORIES;

  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayYMD());
  const [expenseVendor, setExpenseVendor] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseSubcategory, setExpenseSubcategory] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [expenseGst, setExpenseGst] = useState(false);
  const [expenseGstAmount, setExpenseGstAmount] = useState("");
  const [expenseHasBillNumber, setExpenseHasBillNumber] = useState(false);
  const [expenseBillNumber, setExpenseBillNumber] = useState("");
  const [expenseByCheque, setExpenseByCheque] = useState(false);
  const [expenseChequeAccount, setExpenseChequeAccount] = useState("");
  const [expenseAttachReceipt, setExpenseAttachReceipt] = useState(false);
  const [expenseReceiptPart, setExpenseReceiptPart] = useState<UploadPart | null>(null);
  const [savingExpense, setSavingExpense] = useState(false);

  const [bankSheetOpen, setBankSheetOpen] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankLabel, setBankLabel] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankBalance, setBankBalance] = useState("");
  const [bankAssignToInvoice, setBankAssignToInvoice] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [subcategoryPickerOpen, setSubcategoryPickerOpen] = useState(false);
  const [chequePickerOpen, setChequePickerOpen] = useState(false);
  const [vendorSuggestionsOpen, setVendorSuggestionsOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [subcategoriesPopupOpen, setSubcategoriesPopupOpen] = useState(false);
  const [subcategoriesDraft, setSubcategoriesDraft] = useState<string[]>([""]);

  const statusLabel = STATUS_ORDER[statusIndex % STATUS_ORDER.length];
  const isPaidView = statusLabel === "Paid";

  const dismissMenus = useCallback(() => {
    setInvoiceMenu(null);
    setExpenseMenu(null);
    setBankMenu(null);
    setMenuAnchor(null);
  }, []);
  const dismissMenusRef = useRef(dismissMenus);
  dismissMenusRef.current = dismissMenus;

  const formatAmount = useCallback(
    (amount: number | string | null | undefined) =>
      formatCurrencyAmount(amount, countryCode, { fallback: "—" }),
    [countryCode]
  );

  useEffect(() => {
    if (expenseCategories.length === 0) {
      setExpenseCategories(cloneCategories(EXPENSE_CATEGORIES));
    }
  }, [expenseCategories.length]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      void refreshAccounts(effectiveCategories);
      return undefined;
      // eslint-disable-next-line react-hooks/exhaustive-deps -- seed categories once per focus
    }, [refresh, refreshAccounts])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    InteractionManager.runAfterInteractions(() => {
      void Promise.all([refresh(), refreshAccounts(effectiveCategories)]).finally(() =>
        setRefreshing(false)
      );
    });
  }, [effectiveCategories, refresh, refreshAccounts]);

  const invoiceList = isPaidView ? paid : unpaid;
  const filteredInvoices = useMemo(
    () => invoiceList.filter((row) => matchesInvoiceSearch(row, search)),
    [invoiceList, search]
  );
  const filteredExpenses = useMemo(
    () => expenses.filter((row) => matchesExpenseSearch(row, search, effectiveCategories)),
    [expenses, search, effectiveCategories]
  );
  const filteredBanks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return banks;
    return banks.filter((row) =>
      [row.bankName, row.accountName, row.accountNumber].join(" ").toLowerCase().includes(q)
    );
  }, [banks, search]);

  const selectedExpenseCategory = useMemo(
    () => effectiveCategories.find((cat) => cat.value === expenseCategory),
    [effectiveCategories, expenseCategory]
  );
  const expenseCategoryLabels = useMemo(
    () => effectiveCategories.map((cat) => cat.label),
    [effectiveCategories]
  );
  const expenseSubcategoryLabels = useMemo(
    () => selectedExpenseCategory?.subcategories.map((sub) => sub.label) ?? [],
    [selectedExpenseCategory]
  );
  const expenseSubcategoryOptions = useMemo(
    () => selectedExpenseCategory?.subcategories ?? [],
    [selectedExpenseCategory]
  );
  const selectedExpenseCategoryLabel = selectedExpenseCategory?.label ?? "";
  const selectedExpenseSubcategoryLabel =
    selectedExpenseCategory?.subcategories.find((sub) => sub.value === expenseSubcategory)?.label ??
    "";

  const expenseVendorOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const row of expenses) {
      const normalized = normalizeVendorLabel(row.vendor);
      if (!normalized) continue;
      const key = normalized.toLowerCase();
      if (!seen.has(key)) seen.set(key, normalized);
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  }, [expenses]);

  const filteredVendorOptions = useMemo(() => {
    const q = normalizeVendorLabel(expenseVendor).toLowerCase();
    const base = expenseVendorOptions;
    if (!q) return base.slice(0, 25);
    return base.filter((opt) => opt.toLowerCase().includes(q)).slice(0, 25);
  }, [expenseVendor, expenseVendorOptions]);

  const chequeAccountOptions = useMemo(
    () => banks.map((bank) => bank.bankName).filter(Boolean),
    [banks]
  );

  useEffect(() => {
    setSearch("");
    setPreviewRow(null);
    dismissMenus();
    setExpenseSheetOpen(false);
    setBankSheetOpen(false);
  }, [section, dismissMenus]);

  useEffect(() => {
    dismissMenus();
  }, [statusIndex, dismissMenus]);

  const stepStatus = useCallback((dir: -1 | 1) => {
    setStatusIndex((i) => (i + dir + STATUS_ORDER.length) % STATUS_ORDER.length);
  }, []);

  const openCardMenu = useCallback(
    (
      id: string,
      open: () => void
    ) => {
      const node = menuBtnRefs.current[id];
      if (node && "measureInWindow" in node && typeof node.measureInWindow === "function") {
        node.measureInWindow((x, y, w, h) => {
          setMenuAnchor({ x, y, w, h });
          open();
        });
      } else {
        setMenuAnchor(null);
        open();
      }
    },
    []
  );

  const resetExpenseForm = useCallback(() => {
    setEditingExpenseId(null);
    setExpenseAmount("");
    setExpenseDate(todayYMD());
    setExpenseVendor("");
    setExpenseCategory("");
    setExpenseSubcategory("");
    setExpenseNotes("");
    setExpenseGst(false);
    setExpenseGstAmount("");
    setExpenseHasBillNumber(false);
    setExpenseBillNumber("");
    setExpenseByCheque(false);
    setExpenseChequeAccount("");
    setExpenseAttachReceipt(false);
    setExpenseReceiptPart(null);
  }, []);

  const openAddExpenseSheet = useCallback(() => {
    dismissMenus();
    resetExpenseForm();
    const firstCategory = effectiveCategories[0];
    if (firstCategory) {
      setExpenseCategory(firstCategory.value);
      const firstSub = firstCategory.subcategories?.[0];
      if (firstSub) setExpenseSubcategory(firstSub.value);
    }
    setExpenseSheetOpen(true);
  }, [dismissMenus, effectiveCategories, resetExpenseForm]);

  const openEditExpenseSheet = useCallback(
    (row: ShopExpenseRow) => {
      dismissMenus();
      setEditingExpenseId(row.id);
      setExpenseAmount(String(row.amount));
      setExpenseDate(row.date);
      setExpenseVendor(row.vendor);
      setExpenseCategory(row.category);
      setExpenseSubcategory(row.subCategory);
      setExpenseNotes(row.notes);
      setExpenseGst(row.gst);
      setExpenseGstAmount(row.gstAmount ? String(row.gstAmount) : "");
      setExpenseHasBillNumber(Boolean(row.billNumber));
      setExpenseBillNumber(row.billNumber ?? "");
      setExpenseByCheque(row.byCheque);
      setExpenseChequeAccount(row.account ?? "");
      setExpenseAttachReceipt(row.hasReceipt);
      setExpenseReceiptPart(null);
      setExpenseSheetOpen(true);
    },
    [dismissMenus]
  );

  const closeExpenseSheet = useCallback(() => {
    resetExpenseForm();
    setExpenseSheetOpen(false);
  }, [resetExpenseForm]);

  const handleExpenseCategoryChange = useCallback(
    (nextCategoryLabel: string) => {
      if (!nextCategoryLabel) {
        setExpenseCategory("");
        setExpenseSubcategory("");
        return;
      }
      const match = effectiveCategories.find((cat) => cat.label === nextCategoryLabel);
      setExpenseCategory(match?.value ?? slugifyLabel(nextCategoryLabel));
      setExpenseSubcategory("");
    },
    [effectiveCategories]
  );

  const handleExpenseSubcategoryChange = useCallback(
    (nextSubcategoryLabel: string) => {
      if (!nextSubcategoryLabel) {
        setExpenseSubcategory("");
        return;
      }
      const match = expenseSubcategoryOptions.find((sub) => sub.label === nextSubcategoryLabel);
      setExpenseSubcategory(match?.value ?? slugifyLabel(nextSubcategoryLabel));
    },
    [expenseSubcategoryOptions]
  );

  const openSubcategoriesPopup = useCallback(() => {
    if (!expenseCategory) return;
    setSubcategoriesDraft(expenseSubcategoryLabels.length ? [...expenseSubcategoryLabels] : [""]);
    setSubcategoriesPopupOpen(true);
  }, [expenseCategory, expenseSubcategoryLabels]);

  const saveSubcategoriesPopup = useCallback(() => {
    if (!expenseCategory) return;
    const labels = dedupeLabels(subcategoriesDraft);
    const previousLabels = new Set(expenseSubcategoryLabels.map((label) => label.toLowerCase()));
    const newlyAdded = labels.filter((label) => !previousLabels.has(label.toLowerCase()));

    const nextSubcategories = labels.map((label) => {
      const existing = expenseSubcategoryOptions.find(
        (sub) => sub.label.toLowerCase() === label.toLowerCase()
      );
      if (existing) return { ...existing, label };
      let value = slugifyLabel(label);
      if (expenseSubcategoryOptions.some((sub) => sub.value === value)) {
        value = `${value}-${Date.now()}`;
      }
      return { value, label };
    });

    setExpenseCategories((prev) =>
      prev.map((cat) =>
        cat.value === expenseCategory ? { ...cat, subcategories: nextSubcategories } : cat
      )
    );

    if (newlyAdded.length > 0) {
      const lastAdded = newlyAdded[newlyAdded.length - 1];
      const match = nextSubcategories.find(
        (sub) => sub.label.toLowerCase() === lastAdded.toLowerCase()
      );
      if (match) setExpenseSubcategory(match.value);
    } else if (
      expenseSubcategory &&
      !nextSubcategories.some((sub) => sub.value === expenseSubcategory)
    ) {
      setExpenseSubcategory(nextSubcategories[0]?.value ?? "");
    }

    setSubcategoriesPopupOpen(false);
  }, [
    expenseCategory,
    expenseSubcategory,
    expenseSubcategoryLabels,
    expenseSubcategoryOptions,
    subcategoriesDraft,
  ]);

  const pickReceiptImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast("Photo library permission is required.", { type: "error" });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsMultipleSelection: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset?.uri) return;
    setExpenseReceiptPart(
      localImageMultipartPart(asset.uri, {
        mimeType: asset.mimeType,
        fileName: asset.fileName,
        fallbackBase: "receipt",
      })
    );
    setExpenseAttachReceipt(true);
  }, [showToast]);

  const handleSaveExpense = useCallback(async () => {
    const trimmedVendor = expenseVendor.trim();
    const parsedAmount = Number.parseFloat(expenseAmount);
    const parsedGst = Number.parseFloat(expenseGstAmount);

    if (!expenseAmount.trim() || !Number.isFinite(parsedAmount)) {
      showToast("Amount is required.", { type: "error" });
      return;
    }
    if (!expenseDate) {
      showToast("Date is required.", { type: "error" });
      return;
    }
    if (!trimmedVendor) {
      showToast("Vendor is required.", { type: "error" });
      return;
    }
    if (!expenseCategory) {
      showToast("Category is required.", { type: "error" });
      return;
    }
    if (!expenseSubcategory) {
      showToast("Subcategory is required.", { type: "error" });
      return;
    }
    if (!token) {
      showToast("Sign in to save expense.", { type: "error" });
      return;
    }

    setSavingExpense(true);
    try {
      const ok = await saveExpense(
        {
          date: expenseDate,
          vendor: trimmedVendor,
          amount: parsedAmount,
          category: expenseCategory,
          subCategory: expenseSubcategory,
          notes: expenseNotes,
          gst: expenseGst ? (Number.isFinite(parsedGst) ? parsedGst : 0) : 0,
          billNumber:
            expenseHasBillNumber && expenseBillNumber.trim()
              ? expenseBillNumber.trim()
              : undefined,
          account: expenseByCheque ? expenseChequeAccount : undefined,
          expenseImage: expenseAttachReceipt ? expenseReceiptPart : null,
        },
        editingExpenseId
      );
      if (ok) {
        await refreshAccounts(effectiveCategories);
        closeExpenseSheet();
      }
    } finally {
      setSavingExpense(false);
    }
  }, [
    closeExpenseSheet,
    editingExpenseId,
    effectiveCategories,
    expenseAmount,
    expenseAttachReceipt,
    expenseBillNumber,
    expenseByCheque,
    expenseCategory,
    expenseChequeAccount,
    expenseDate,
    expenseGst,
    expenseGstAmount,
    expenseHasBillNumber,
    expenseNotes,
    expenseReceiptPart,
    expenseSubcategory,
    expenseVendor,
    refreshAccounts,
    saveExpense,
    showToast,
    token,
  ]);

  const openAddBankSheet = useCallback(() => {
    dismissMenus();
    setEditingBankId(null);
    setBankLabel("");
    setBankAccountName("");
    setBankAccountNumber("");
    setBankBalance("");
    setBankAssignToInvoice(banks.length === 0);
    setBankSheetOpen(true);
  }, [banks.length, dismissMenus]);

  const openEditBankSheet = useCallback(
    (row: ShopBankRow) => {
      dismissMenus();
      setEditingBankId(row.id);
      setBankLabel(row.bankName);
      setBankAccountName(row.accountName === "—" ? "" : row.accountName);
      setBankAccountNumber(row.accountNumber === "—" ? "" : row.accountNumber);
      setBankBalance(String(row.totalBalance));
      setBankAssignToInvoice(row.assignToInvoice);
      setBankSheetOpen(true);
    },
    [dismissMenus]
  );

  const closeBankSheet = useCallback(() => {
    setBankSheetOpen(false);
    setEditingBankId(null);
  }, []);

  const handleSaveBank = useCallback(async () => {
    const trimmedLabel = bankLabel.trim();
    if (!trimmedLabel) {
      showToast("Enter a bank or wallet label.", { type: "error" });
      return;
    }
    const balance = Number(bankBalance);
    if (!Number.isFinite(balance)) {
      showToast("Enter a valid balance.", { type: "error" });
      return;
    }
    if (!token) {
      showToast("Sign in to save bank.", { type: "error" });
      return;
    }

    setSavingBank(true);
    try {
      const ok = await saveBank(
        {
          bankName: trimmedLabel,
          openingBalance: balance,
          totalBalance: balance,
          accountName: bankAccountName.trim() || undefined,
          accountNumber: bankAccountNumber.trim() || undefined,
          assignToInvoice: bankAssignToInvoice,
        },
        editingBankId
      );
      if (ok) {
        await refreshAccounts(effectiveCategories);
        closeBankSheet();
      }
    } finally {
      setSavingBank(false);
    }
  }, [
    bankAccountName,
    bankAccountNumber,
    bankAssignToInvoice,
    bankBalance,
    bankLabel,
    closeBankSheet,
    editingBankId,
    effectiveCategories,
    refreshAccounts,
    saveBank,
    showToast,
    token,
  ]);

  const markPaid = useCallback(
    async (row: JobCardListRow) => {
      if (!token) {
        showToast("Sign in to update payment.", { type: "error" });
        return;
      }
      dismissMenus();
      setActionBusyId(row.id);
      try {
        const jobCardNo = pickJobCardNoForApi(row);
        if (!jobCardNo) {
          showToast("Missing job card number.", { type: "error" });
          return;
        }
        const res = await markAutoshopInvoicePaid(token, jobCardNo);
        if (!res.ok) {
          showToast("Could not update payment.", { type: "error" });
          return;
        }
        showToast("Marked as paid.", { type: "success" });
        await refresh();
      } catch {
        showToast("Network error.", { type: "error" });
      } finally {
        setActionBusyId(null);
      }
    },
    [dismissMenus, refresh, showToast, token]
  );

  const confirmMarkPaid = useCallback(
    (row: JobCardListRow) => {
      Alert.alert("Mark as paid?", "Mark this invoice as paid?", [
        { text: "Cancel", style: "cancel" },
        { text: "Mark paid", onPress: () => void markPaid(row) },
      ]);
    },
    [markPaid]
  );

  const sendNotification = useCallback(
    async (row: JobCardListRow, label: string) => {
      if (!token) {
        showToast("Sign in to send notification.", { type: "error" });
        return;
      }
      dismissMenus();
      setActionBusyId(row.id);
      try {
        const jobCardNo = pickJobCardNoForApi(row);
        if (!jobCardNo) {
          showToast("Missing job card number.", { type: "error" });
          return;
        }
        const res = await sendAutoshopJobCardForApproval(token, jobCardNo);
        if (!res.ok) {
          showToast(`${label} failed.`, { type: "error" });
          return;
        }
        showToast(`${label} sent.`, { type: "success" });
      } catch {
        showToast("Network error.", { type: "error" });
      } finally {
        setActionBusyId(null);
      }
    },
    [dismissMenus, showToast, token]
  );

  const openInvoicePreview = useCallback(
    (row: JobCardListRow) => {
      dismissMenus();
      setPreviewRow(row);
    },
    [dismissMenus]
  );

  const activeMenu = invoiceMenu ?? expenseMenu ?? bankMenu;
  const menuCardLayoutStyle = useMemo(() => {
    if (!activeMenu) return null;
    if (menuAnchor) return getAnchoredMenuStyle(menuAnchor);
    return {
      position: "absolute" as const,
      top: "30%" as const,
      left: Math.max(8, (windowWidth - 228) / 2),
      minWidth: 228,
      zIndex: 2,
    };
  }, [activeMenu, menuAnchor, windowWidth]);

  const listLoading = section === "invoices" ? loading : accountsLoading;
  const listEmpty =
    section === "invoices"
      ? filteredInvoices.length === 0
      : section === "expenses"
        ? filteredExpenses.length === 0
        : filteredBanks.length === 0;

  const emptySecondary =
    section === "invoices"
      ? isPaidView
        ? "No paid invoices available"
        : "No unpaid invoices available"
      : section === "expenses"
        ? "No expenses yet"
        : "No bank accounts yet";

  const headerGradient = [colors.tabBarBg, "#EEF6FF", colors.white] as const;

  return (
    <StackScreenFrame
      title="Wallet"
      backgroundColor={colors.bgProfile}
      headerGradient={headerGradient}
      scroll={false}
      floatingContent={
        section === "expenses" ? (
          <Fab label="Add Expense" icon="add" onPress={openAddExpenseSheet} />
        ) : section === "banks" ? (
          <Fab label="Add Bank" icon="add" onPress={openAddBankSheet} />
        ) : undefined
      }
    >
      <View style={styles.page}>
        <View style={styles.sectionTabs}>
          {SECTION_TABS.map((tab) => {
            const active = section === tab.id;
            return (
              <Pressable
                key={tab.id}
                style={[styles.sectionTab, active && styles.sectionTabActive]}
                onPress={() => setSection(tab.id)}
              >
                <Text style={[styles.sectionTabText, active && styles.sectionTabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {section === "invoices" ? (
          <ChevronLabelBar
            label={statusLabel}
            edgeAligned
            style={styles.statusBar}
            onPrevious={() => stepStatus(-1)}
            onNext={() => stepStatus(1)}
          />
        ) : null}

        <View style={styles.toolbar}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor={colors.textLight}
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
          {listLoading && listEmpty ? <WalletSkeletonList /> : null}

          {!listLoading && listEmpty ? (
            <View style={styles.emptyBlock}>
              <Ionicons name="wallet-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No Data Yet</Text>
              <Text style={styles.emptySub}>{emptySecondary}</Text>
            </View>
          ) : null}

          {section === "invoices" &&
            filteredInvoices.map((row) => {
              const { time, dateLabel } = pickWalletWhen(row, row.raw);
              const badge = shortJobBadgeCode(row.jobNo);
              const amountStr = formatWalletAmount(row.total, isPaidView, countryCode);
              const amountColor = isPaidView ? colors.success : colors.danger;
              const badgeBg = isPaidView ? colors.success : colors.danger;
              const busy = actionBusyId === row.id;

              return (
                <SurfaceCard key={row.id} shadow="card" style={styles.txCard}>
                  <View style={styles.txRow}>
                    <View style={{ ...styles.jobBadge, backgroundColor: badgeBg }}>
                      <Text style={styles.jobBadgeLine1}>JobCard</Text>
                      <Text style={styles.jobBadgeLine2}>{badge}</Text>
                    </View>

                    <View style={styles.txMain}>
                      <Text style={styles.txName} numberOfLines={1}>
                        {row.customerName ?? "Customer"}
                      </Text>
                      <View style={styles.phonePill}>
                        <Ionicons name="call-outline" size={14} color={colors.primary} />
                        <Text style={styles.phonePillText} numberOfLines={1}>
                          {row.phone?.trim() ? row.phone : "—"}
                        </Text>
                      </View>
                      <View style={styles.txMeta}>
                        <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                        <Text style={styles.txMetaText}>{time}</Text>
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color={colors.textMuted}
                          style={styles.metaCal}
                        />
                        <Text style={styles.txMetaText}>{dateLabel}</Text>
                      </View>
                    </View>

                    <View style={styles.txRight}>
                      <Text style={{ ...styles.txAmount, color: amountColor }}>{amountStr}</Text>
                      <View
                        collapsable={false}
                        ref={(el) => {
                          menuBtnRefs.current[row.id] = el;
                        }}
                      >
                        <Pressable
                          style={styles.txMenuBtn}
                          hitSlop={6}
                          disabled={busy}
                          onPress={() =>
                            openCardMenu(row.id, () =>
                              setInvoiceMenu({ row, isPaid: isPaidView })
                            )
                          }
                        >
                          <Ionicons
                            name={busy ? "time-outline" : "ellipsis-vertical"}
                            size={18}
                            color={busy ? colors.textLight : colors.primary}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </SurfaceCard>
              );
            })}

          {section === "expenses" &&
            filteredExpenses.map((row) => {
              const labels = categoryLabel(effectiveCategories, row.category, row.subCategory);
              return (
                <SurfaceCard key={row.id} shadow="card" style={styles.txCard}>
                  <View style={styles.txRow}>
                    <View style={styles.expenseIcon}>
                      <Ionicons name="receipt-outline" size={22} color={colors.primary} />
                    </View>
                    <Pressable style={styles.txMain} onPress={() => openEditExpenseSheet(row)}>
                      <Text style={styles.txName} numberOfLines={1}>
                        {row.vendor || "Vendor"}
                      </Text>
                      <Text style={styles.txMetaText}>
                        {formatDisplayDate(row.date)} · {labels.category}
                      </Text>
                      {labels.subcategory ? (
                        <Text style={styles.txMetaText}>{labels.subcategory}</Text>
                      ) : null}
                    </Pressable>
                    <View style={styles.txRight}>
                      <Text style={styles.txAmount}>{formatAmount(row.amount)}</Text>
                      <View
                        collapsable={false}
                        ref={(el) => {
                          menuBtnRefs.current[`exp-${row.id}`] = el;
                        }}
                      >
                        <Pressable
                          style={styles.txMenuBtn}
                          hitSlop={6}
                          onPress={() =>
                            openCardMenu(`exp-${row.id}`, () => setExpenseMenu({ row }))
                          }
                        >
                          <Ionicons name="ellipsis-vertical" size={18} color={colors.primary} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </SurfaceCard>
              );
            })}

          {section === "banks" &&
            filteredBanks.map((row) => (
              <SurfaceCard key={row.id} shadow="card" style={styles.txCard}>
                <View style={styles.txRow}>
                  <View style={styles.bankIcon}>
                    <Ionicons name="business-outline" size={22} color={colors.primary} />
                  </View>
                  <Pressable style={styles.txMain} onPress={() => openEditBankSheet(row)}>
                    <Text style={styles.txName} numberOfLines={1}>
                      {row.bankName}
                    </Text>
                    <Text style={styles.txMetaText}>{row.accountName}</Text>
                    <Text style={styles.txMetaText}>{row.accountNumber}</Text>
                    {row.assignToInvoice ? (
                      <Text style={styles.assignedHint}>Assigned to invoice</Text>
                    ) : null}
                  </Pressable>
                  <View style={styles.txRight}>
                    <Text style={styles.txAmount}>{formatAmount(row.totalBalance)}</Text>
                    <View
                      collapsable={false}
                      ref={(el) => {
                        menuBtnRefs.current[`bank-${row.id}`] = el;
                      }}
                    >
                      <Pressable
                        style={styles.txMenuBtn}
                        hitSlop={6}
                        onPress={() =>
                          openCardMenu(`bank-${row.id}`, () => setBankMenu({ row }))
                        }
                      >
                        <Ionicons name="ellipsis-vertical" size={18} color={colors.primary} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </SurfaceCard>
            ))}
        </ScrollView>
      </View>

      <Modal visible={activeMenu != null} transparent animationType="fade" onRequestClose={dismissMenus}>
        <View style={styles.menuModalRoot}>
          <Pressable style={styles.menuBackdrop} onPress={dismissMenus} />
          {activeMenu && menuCardLayoutStyle ? (
            <View style={{ ...styles.menuCard, ...menuCardLayoutStyle }}>
              {invoiceMenu ? (
                invoiceMenu.isPaid ? (
                  <>
                    <Pressable
                      style={styles.menuRowBtn}
                      onPress={() => openInvoicePreview(invoiceMenu.row)}
                    >
                      <Text style={styles.menuRowLabel}>View Invoice</Text>
                    </Pressable>
                    <Pressable
                      style={styles.menuRowBtn}
                      onPress={() => void sendNotification(invoiceMenu.row, "Receipt")}
                    >
                      <Text style={styles.menuRowLabel}>Send Receipt</Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Pressable
                      style={styles.menuRowBtn}
                      onPress={() => confirmMarkPaid(invoiceMenu.row)}
                    >
                      <Text style={styles.menuRowLabel}>Mark as Paid</Text>
                    </Pressable>
                    <Pressable
                      style={styles.menuRowBtn}
                      onPress={() => void sendNotification(invoiceMenu.row, "Reminder")}
                    >
                      <Text style={styles.menuRowLabel}>Send Reminder</Text>
                    </Pressable>
                    <Pressable
                      style={styles.menuRowBtn}
                      onPress={() => openInvoicePreview(invoiceMenu.row)}
                    >
                      <Text style={styles.menuRowLabel}>View Invoice</Text>
                    </Pressable>
                  </>
                )
              ) : null}

              {expenseMenu ? (
                <Pressable
                  style={styles.menuRowBtn}
                  onPress={() => openEditExpenseSheet(expenseMenu.row)}
                >
                  <Text style={styles.menuRowLabel}>Edit Expense</Text>
                </Pressable>
              ) : null}

              {bankMenu ? (
                <Pressable
                  style={styles.menuRowBtn}
                  onPress={() => openEditBankSheet(bankMenu.row)}
                >
                  <Text style={styles.menuRowLabel}>Edit Bank</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </Modal>

      <Modal
        visible={previewRow != null}
        transparent
        animationType="slide"
        onRequestClose={() => setPreviewRow(null)}
      >
        <ModalKeyboardRoot onBackdropPress={() => setPreviewRow(null)} scrimColor="rgba(0,0,0,0.42)">
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetTitleRow}>
              <Text style={styles.sheetTitle}>Invoice Preview</Text>
              <Pressable style={styles.sheetClose} onPress={() => setPreviewRow(null)}>
                <Ionicons name="close" size={18} color="#D84D4D" />
              </Pressable>
            </View>
            {previewRow ? (
              <View style={styles.previewBody}>
                <Text style={styles.previewBill}>{displayBillId(previewRow)}</Text>
                <Text style={styles.previewName}>{previewRow.customerName?.trim() || "—"}</Text>
                <Text style={styles.previewMeta}>{previewRow.phone?.trim() || "—"}</Text>
                <Text style={styles.previewMeta}>{previewRow.vehiclePlate?.trim() || "—"}</Text>
                <Text style={styles.previewAmount}>{formatAmount(previewRow.total)}</Text>
                <Text style={styles.previewMeta}>
                  {previewRow.date ? formatDisplayDate(previewRow.date) : "—"}
                </Text>
              </View>
            ) : null}
          </View>
        </ModalKeyboardRoot>
      </Modal>

      <Modal
        transparent
        visible={expenseSheetOpen}
        animationType="slide"
        onRequestClose={closeExpenseSheet}
      >
        <ModalKeyboardRoot onBackdropPress={closeExpenseSheet} scrimColor="rgba(0,0,0,0.38)">
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetTitleRow}>
              <Text style={styles.sheetTitle}>
                {editingExpenseId ? "Edit Expense" : "Add Expense"}
              </Text>
              <Pressable style={styles.sheetClose} onPress={closeExpenseSheet}>
                <Ionicons name="close" size={18} color="#D84D4D" />
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              automaticallyAdjustKeyboardInsets
              showsVerticalScrollIndicator={false}
              style={styles.sheetFormScroll}
              contentContainerStyle={styles.sheetFormScrollContent}
            >
              <FieldLabel label="Amount" required />
              <FormInput
                value={expenseAmount}
                onChangeText={setExpenseAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              <FieldLabel label="Date" required />
              <Pressable style={styles.dateBtn} onPress={() => setDatePickerOpen(true)}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <Text style={styles.dateBtnText}>{formatDisplayDate(expenseDate)}</Text>
              </Pressable>

              <FieldLabel label="Vendor" required />
              <FormInput
                value={expenseVendor}
                onChangeText={(t) => {
                  setExpenseVendor(t);
                  setVendorSuggestionsOpen(true);
                }}
                placeholder="Vendor name"
              />
              {vendorSuggestionsOpen && filteredVendorOptions.length > 0 ? (
                <View style={styles.suggestBox}>
                  {filteredVendorOptions.map((opt) => (
                    <Pressable
                      key={opt}
                      style={styles.suggestItem}
                      onPress={() => {
                        setExpenseVendor(opt);
                        setVendorSuggestionsOpen(false);
                      }}
                    >
                      <Text style={styles.suggestText}>{opt}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <FieldLabel label="Category" required />
              <Pressable style={styles.selectBtn} onPress={() => setCategoryPickerOpen(true)}>
                <Text style={styles.selectBtnText}>
                  {selectedExpenseCategoryLabel || "Select category"}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
              </Pressable>

              <FieldLabel label="Subcategory" required />
              <Pressable
                style={[styles.selectBtn, !expenseCategory && styles.inputDisabled]}
                onPress={() => expenseCategory && setSubcategoryPickerOpen(true)}
              >
                <Text style={styles.selectBtnText}>
                  {selectedExpenseSubcategoryLabel || "Select subcategory"}
                </Text>
                <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
              </Pressable>

              <FieldLabel label="Notes" />
              <FormInput
                value={expenseNotes}
                onChangeText={setExpenseNotes}
                placeholder="Notes"
                multiline
              />

              <CheckRow
                label="Attach Image of Receipt"
                checked={expenseAttachReceipt}
                onChange={(v) => {
                  setExpenseAttachReceipt(v);
                  if (!v) setExpenseReceiptPart(null);
                }}
              />
              {expenseAttachReceipt ? (
                <Pressable style={styles.secondaryBtn} onPress={() => void pickReceiptImage()}>
                  <Text style={styles.secondaryBtnText}>
                    {expenseReceiptPart?.name || "Choose receipt image"}
                  </Text>
                </Pressable>
              ) : null}

              <CheckRow
                label="Bill Number"
                checked={expenseHasBillNumber}
                onChange={(v) => {
                  setExpenseHasBillNumber(v);
                  if (!v) setExpenseBillNumber("");
                }}
              />
              {expenseHasBillNumber ? (
                <FormInput
                  value={expenseBillNumber}
                  onChangeText={setExpenseBillNumber}
                  placeholder="Bill number"
                />
              ) : null}

              <CheckRow
                label="By Cheque"
                checked={expenseByCheque}
                onChange={(v) => {
                  setExpenseByCheque(v);
                  if (!v) setExpenseChequeAccount("");
                }}
              />
              {expenseByCheque ? (
                <Pressable style={styles.selectBtn} onPress={() => setChequePickerOpen(true)}>
                  <Text style={styles.selectBtnText}>
                    {expenseChequeAccount || "Select account"}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                </Pressable>
              ) : null}

              <CheckRow
                label="GST"
                checked={expenseGst}
                onChange={(v) => {
                  setExpenseGst(v);
                  if (!v) setExpenseGstAmount("");
                }}
              />
              {expenseGst ? (
                <FormInput
                  value={expenseGstAmount}
                  onChangeText={setExpenseGstAmount}
                  placeholder="GST amount"
                  keyboardType="decimal-pad"
                />
              ) : null}

              <Pressable
                style={[styles.saveBtn, savingExpense && styles.saveBtnDisabled]}
                disabled={savingExpense}
                onPress={() => void handleSaveExpense()}
              >
                <Text style={styles.saveBtnText}>
                  {savingExpense
                    ? editingExpenseId
                      ? "Updating..."
                      : "Saving..."
                    : editingExpenseId
                      ? "Update"
                      : "Save"}
                </Text>
              </Pressable>
              <Pressable style={styles.cancelBtn} onPress={closeExpenseSheet} disabled={savingExpense}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </View>
        </ModalKeyboardRoot>
      </Modal>

      <Modal transparent visible={bankSheetOpen} animationType="slide" onRequestClose={closeBankSheet}>
        <ModalKeyboardRoot onBackdropPress={closeBankSheet} scrimColor="rgba(0,0,0,0.38)">
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetTitleRow}>
              <Text style={styles.sheetTitle}>
                {editingBankId ? "Edit Bank Account" : "Add Bank Account"}
              </Text>
              <Pressable style={styles.sheetClose} onPress={closeBankSheet}>
                <Ionicons name="close" size={18} color="#D84D4D" />
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              automaticallyAdjustKeyboardInsets
              showsVerticalScrollIndicator={false}
              style={styles.sheetFormScroll}
              contentContainerStyle={styles.sheetFormScrollContent}
            >
              <FieldLabel label="Bank / Wallet Label" required />
              <FormInput
                value={bankLabel}
                onChangeText={setBankLabel}
                placeholder="e.g. Business Chequing"
              />

              <FieldLabel label="Account Name" />
              <FormInput
                value={bankAccountName}
                onChangeText={setBankAccountName}
                placeholder="Account holder name"
              />

              <FieldLabel label="Account Number" />
              <FormInput
                value={bankAccountNumber}
                onChangeText={setBankAccountNumber}
                placeholder="****1234"
              />

              <FieldLabel label="Balance" required />
              <FormInput
                value={bankBalance}
                onChangeText={setBankBalance}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              <CheckRow
                label="Assign to invoice"
                checked={bankAssignToInvoice}
                onChange={setBankAssignToInvoice}
              />

              <Pressable
                style={[styles.saveBtn, savingBank && styles.saveBtnDisabled]}
                disabled={savingBank}
                onPress={() => void handleSaveBank()}
              >
                <Text style={styles.saveBtnText}>
                  {savingBank
                    ? editingBankId
                      ? "Updating..."
                      : "Saving..."
                    : editingBankId
                      ? "Update"
                      : "Save"}
                </Text>
              </Pressable>
              <Pressable style={styles.cancelBtn} onPress={closeBankSheet} disabled={savingBank}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </View>
        </ModalKeyboardRoot>
      </Modal>

      <OptionPickerModal
        visible={categoryPickerOpen}
        title="Category"
        options={expenseCategoryLabels}
        selected={selectedExpenseCategoryLabel}
        onSelect={handleExpenseCategoryChange}
        onClose={() => setCategoryPickerOpen(false)}
      />
      <OptionPickerModal
        visible={subcategoryPickerOpen}
        title="Subcategory"
        options={expenseSubcategoryLabels}
        selected={selectedExpenseSubcategoryLabel}
        onSelect={handleExpenseSubcategoryChange}
        onClose={() => setSubcategoryPickerOpen(false)}
        onEditAddNew={openSubcategoriesPopup}
      />
      <OptionPickerModal
        visible={chequePickerOpen}
        title="Cheque account"
        options={chequeAccountOptions}
        selected={expenseChequeAccount}
        onSelect={setExpenseChequeAccount}
        onClose={() => setChequePickerOpen(false)}
      />

      {datePickerOpen ? (
        Platform.OS === "ios" ? (
          <Modal transparent visible animationType="fade" onRequestClose={() => setDatePickerOpen(false)}>
            <ModalKeyboardRoot onBackdropPress={() => setDatePickerOpen(false)} scrimColor="rgba(0,0,0,0.35)">
              <View style={styles.iosDateSheet}>
                <View style={styles.iosDateHeader}>
                  <Pressable onPress={() => setDatePickerOpen(false)} hitSlop={8}>
                    <Text style={styles.iosDateBtn}>Cancel</Text>
                  </Pressable>
                  <Text style={styles.iosDateTitle}>Date</Text>
                  <Pressable onPress={() => setDatePickerOpen(false)} hitSlop={8}>
                    <Text style={[styles.iosDateBtn, styles.iosDateBtnPrimary]}>Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={ymdToDate(expenseDate)}
                  mode="date"
                  display="spinner"
                  onChange={(_, d) => {
                    if (d) setExpenseDate(dateToYmd(d));
                  }}
                />
              </View>
            </ModalKeyboardRoot>
          </Modal>
        ) : (
          <DateTimePicker
            value={ymdToDate(expenseDate)}
            mode="date"
            display="default"
            onChange={(_, d) => {
              setDatePickerOpen(false);
              if (d) setExpenseDate(dateToYmd(d));
            }}
          />
        )
      ) : null}

      <Modal
        visible={subcategoriesPopupOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSubcategoriesPopupOpen(false)}
      >
        <ModalKeyboardRoot
          onBackdropPress={() => setSubcategoriesPopupOpen(false)}
          scrimColor="rgba(0,0,0,0.42)"
        >
          <View style={styles.pickerSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>
                Edit / Add Subcategories
                {selectedExpenseCategoryLabel ? ` — ${selectedExpenseCategoryLabel}` : ""}
              </Text>
              <Pressable onPress={() => setSubcategoriesPopupOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView style={styles.pickerList} keyboardShouldPersistTaps="handled">
              {subcategoriesDraft.map((item, index) => (
                <View key={`sub-draft-${index}`} style={styles.subDraftRow}>
                  <TextInput
                    value={item}
                    onChangeText={(t) =>
                      setSubcategoriesDraft((prev) =>
                        prev.map((v, i) => (i === index ? t : v))
                      )
                    }
                    placeholder="Subcategory name"
                    placeholderTextColor={colors.textLight}
                    style={[styles.input, styles.subDraftInput]}
                  />
                  <Pressable
                    onPress={() =>
                      setSubcategoriesDraft((prev) =>
                        prev.length <= 1 ? [""] : prev.filter((_, i) => i !== index)
                      )
                    }
                    hitSlop={6}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </Pressable>
                </View>
              ))}
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => setSubcategoriesDraft((prev) => [...prev, ""])}
              >
                <Text style={styles.secondaryBtnText}>+ Add row</Text>
              </Pressable>
            </ScrollView>
            <Pressable style={styles.saveBtn} onPress={saveSubcategoriesPopup}>
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={() => setSubcategoriesPopupOpen(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </ModalKeyboardRoot>
      </Modal>
    </StackScreenFrame>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  sectionTabs: {
    flexDirection: "row",
    gap: spacing.sm,
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.sm,
  },
  sectionTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  sectionTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sectionTabText: { color: colors.text, fontWeight: "700", fontSize: fontSizes.sm },
  sectionTabTextActive: { color: colors.white },
  statusBar: {
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.sm,
    paddingVertical: 0,
    minHeight: 34,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radii.lg,
  },
  toolbar: {
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.sm,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
    color: colors.text,
    fontSize: fontSizes.sm,
  },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.xxl * 3,
    gap: spacing.md,
  },
  emptyBlock: {
    alignItems: "center",
    paddingVertical: spacing.xxl * 2,
    gap: spacing.sm,
  },
  emptyTitle: { ...cardTypography.cardTitle, marginTop: spacing.sm },
  emptySub: { fontSize: cardFontSizes.sm, color: colors.textMuted, textAlign: "center" },
  skeletonList: { gap: spacing.md, paddingTop: spacing.sm },
  skeletonCard: { padding: spacing.md },
  skeletonRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  skeletonBadge: { width: 48, height: 48, borderRadius: radii.md, backgroundColor: "#EDF2F7" },
  skeletonTextCol: { flex: 1, gap: 10, paddingTop: 2 },
  skeletonRight: { alignItems: "flex-end", gap: spacing.sm, paddingTop: 2 },
  skeletonLine: { height: 12, borderRadius: 8, backgroundColor: "#EDF2F7" },
  skeletonDot: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#EDF2F7" },
  txCard: { padding: spacing.md },
  txRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  jobBadge: {
    width: 48,
    minHeight: 48,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  jobBadgeLine1: {
    fontSize: cardFontSizes.micro + 1,
    fontWeight: "800",
    color: colors.white,
  },
  jobBadgeLine2: {
    fontSize: cardFontSizes.md,
    fontWeight: "800",
    color: colors.white,
    marginTop: 2,
  },
  expenseIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primaryMutedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  bankIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primaryMutedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  txMain: { flex: 1, minWidth: 0, gap: 4 },
  txName: { fontSize: cardFontSizes.md, fontWeight: "800", color: colors.text },
  phonePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryMutedBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.round,
    maxWidth: "100%",
  },
  phonePillText: { fontSize: cardFontSizes.sm, fontWeight: "700", color: colors.primary },
  txMeta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4, marginTop: 2 },
  metaCal: { marginLeft: spacing.xs },
  txMetaText: { fontSize: cardFontSizes.xs, color: colors.textMuted, fontWeight: "600" },
  assignedHint: { fontSize: cardFontSizes.xs, color: colors.primary, fontWeight: "700" },
  txRight: { alignItems: "flex-end", gap: spacing.sm },
  txAmount: { fontSize: cardFontSizes.md, fontWeight: "800", color: colors.text },
  txMenuBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryMutedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  menuModalRoot: { flex: 1 },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingVertical: spacing.xs,
    ...shadows.card,
  },
  menuRowBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  menuRowLabel: { fontSize: cardFontSizes.md, color: colors.text, fontWeight: "600" },
  sheet: {
    width: "100%",
    maxHeight: "92%",
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    ...shadows.card,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D0D7E2",
    marginBottom: spacing.sm,
  },
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  sheetTitle: { fontSize: fontSizes.lg, fontWeight: "900", color: colors.text },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEECEC",
  },
  sheetFormScroll: { maxHeight: "100%" },
  sheetFormScrollContent: { paddingBottom: spacing.xxl, gap: 2 },
  previewBody: { gap: 6, paddingBottom: spacing.lg },
  previewBill: { fontSize: fontSizes.lg, fontWeight: "900", color: colors.primary },
  previewName: { fontSize: fontSizes.md, fontWeight: "800", color: colors.text },
  previewMeta: { fontSize: fontSizes.sm, color: colors.textMuted, fontWeight: "600" },
  previewAmount: { fontSize: fontSizes.xl, fontWeight: "900", color: colors.text, marginTop: 8 },
  fieldLabel: {
    marginTop: spacing.sm,
    marginBottom: 4,
    fontSize: fontSizes.sm,
    fontWeight: "800",
    color: colors.text,
  },
  required: { color: colors.danger },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    backgroundColor: colors.white,
    color: colors.text,
    fontSize: fontSizes.sm,
  },
  inputTall: { minHeight: 72, textAlignVertical: "top" },
  inputDisabled: { opacity: 0.55 },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  dateBtnText: { color: colors.text, fontWeight: "700", fontSize: fontSizes.sm },
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  selectBtnText: { color: colors.text, fontWeight: "600", fontSize: fontSizes.sm, flex: 1 },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  checkLabel: { color: colors.text, fontWeight: "700", fontSize: fontSizes.sm },
  saveBtn: {
    marginTop: spacing.md,
    minHeight: 44,
    borderRadius: radii.lg,
    backgroundColor: "#5A50C8",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnDisabled: { opacity: 0.75 },
  saveBtnText: { color: colors.white, fontSize: fontSizes.lg, fontWeight: "800" },
  cancelBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  cancelBtnText: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    backgroundColor: colors.white,
    marginTop: spacing.xs,
  },
  secondaryBtnText: { color: colors.primary, fontWeight: "700", fontSize: fontSizes.sm },
  suggestBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    maxHeight: 160,
    overflow: "hidden",
  },
  suggestItem: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  suggestText: { color: colors.text, fontSize: fontSizes.sm, fontWeight: "600" },
  pickerSheet: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    ...shadows.card,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  pickerTitle: {
    flex: 1,
    fontSize: fontSizes.md,
    fontWeight: "800",
    color: colors.text,
    paddingRight: spacing.sm,
  },
  pickerList: { maxHeight: 320 },
  pickerEmpty: { color: colors.textMuted, paddingVertical: spacing.md, textAlign: "center" },
  pickerItem: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radii.md },
  pickerItemActive: { backgroundColor: colors.primaryMutedBg },
  pickerItemText: { color: colors.text, fontSize: fontSizes.sm, fontWeight: "600" },
  pickerItemTextActive: { color: colors.primary, fontWeight: "800" },
  pickerEditBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  pickerEditBtnText: { color: colors.white, fontWeight: "800" },
  subDraftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  subDraftInput: { flex: 1 },
  iosDateSheet: {
    width: "100%",
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingBottom: spacing.lg,
  },
  iosDateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iosDateTitle: { fontWeight: "800", color: colors.text },
  iosDateBtn: { color: colors.textMuted, fontWeight: "700" },
  iosDateBtnPrimary: { color: colors.primary },
});
