import { formatDisplayDate, type LedgerRow, type GstLedgerRow } from "../Accounts/accountData";
import { categoryLabel, type CategoryOption } from "../Accounts/ledgerCategories";

export type GroupBy = "category" | "vendor" | "project";

export function filterGstRows(rows: GstLedgerRow[], fromDate: string, toDate: string) {
  return rows.filter((row) => {
    if (fromDate && row.date < fromDate) return false;
    if (toDate && row.date > toDate) return false;
    return true;
  });
}

export function buildGstRows(
  expenses: LedgerRow[],
  income: LedgerRow[]
): GstLedgerRow[] {
  return [
    ...expenses.filter((row) => row.gst).map((row) => ({ ...row, ledgerType: "expenses" as const })),
    ...income.filter((row) => row.gst).map((row) => ({ ...row, ledgerType: "income" as const })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.vendor.localeCompare(b.vendor));
}

export function filterLedgerRows(
  rows: LedgerRow[],
  fromDate: string,
  toDate: string,
  categoryFilter = ""
) {
  return rows.filter((row) => {
    if (fromDate && row.date < fromDate) return false;
    if (toDate && row.date > toDate) return false;
    if (categoryFilter && row.category !== categoryFilter) return false;
    return true;
  });
}

export function sumAmounts(rows: LedgerRow[]) {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

export function formatReportAmount(amount: number) {
  return amount % 1 === 0 ? String(amount) : amount.toFixed(2);
}

export function formatLongDate(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export type CategoryReportGroup = {
  key: string;
  label: string;
  subcategories: {
    key: string;
    label: string;
    rows: LedgerRow[];
    total: number;
  }[];
  total: number;
};

export type SimpleReportGroup = {
  key: string;
  label: string;
  rows: LedgerRow[];
  total: number;
};

export function groupLedgerByCategory(rows: LedgerRow[], categories: CategoryOption[]): CategoryReportGroup[] {
  const categoryMap = new Map<string, Map<string, LedgerRow[]>>();

  for (const row of rows) {
    if (!categoryMap.has(row.category)) categoryMap.set(row.category, new Map());
    const subMap = categoryMap.get(row.category)!;
    if (!subMap.has(row.subcategory)) subMap.set(row.subcategory, []);
    subMap.get(row.subcategory)!.push(row);
  }

  return [...categoryMap.entries()]
    .map(([categoryKey, subMap]) => {
      const labels = categoryLabel(categories, categoryKey, "");
      const subcategories = [...subMap.entries()]
        .map(([subKey, subRows]) => {
          const subLabels = categoryLabel(categories, categoryKey, subKey);
          const sortedRows = [...subRows].sort((a, b) => a.date.localeCompare(b.date));
          return {
            key: subKey,
            label: subLabels.subcategory,
            rows: sortedRows,
            total: sumAmounts(sortedRows),
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label));

      return {
        key: categoryKey,
        label: labels.category,
        subcategories,
        total: sumAmounts(subcategories.flatMap((sub) => sub.rows)),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function groupLedgerByVendor(rows: LedgerRow[]): SimpleReportGroup[] {
  const vendorMap = new Map<string, LedgerRow[]>();

  for (const row of rows) {
    const key = row.vendor.trim() || "—";
    if (!vendorMap.has(key)) vendorMap.set(key, []);
    vendorMap.get(key)!.push(row);
  }

  return [...vendorMap.entries()]
    .map(([vendor, vendorRows]) => {
      const sortedRows = [...vendorRows].sort((a, b) => a.date.localeCompare(b.date));
      return {
        key: vendor,
        label: vendor.toUpperCase(),
        rows: sortedRows,
        total: sumAmounts(sortedRows),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function groupLedgerByProject(rows: LedgerRow[]): SimpleReportGroup[] {
  const dateMap = new Map<string, LedgerRow[]>();

  for (const row of rows) {
    if (!dateMap.has(row.date)) dateMap.set(row.date, []);
    dateMap.get(row.date)!.push(row);
  }

  return [...dateMap.entries()]
    .map(([date, dateRows]) => {
      const sortedRows = [...dateRows].sort((a, b) => a.vendor.localeCompare(b.vendor));
      return {
        key: date,
        label: formatDisplayDate(date),
        rows: sortedRows,
        total: sumAmounts(sortedRows),
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function groupByLabel(groupBy: GroupBy) {
  if (groupBy === "vendor") return "Vendor";
  if (groupBy === "project") return "Project";
  return "Category";
}

export function groupedReportTitle(reportType: "income" | "expenses", groupBy: GroupBy) {
  const noun = reportType === "expenses" ? "Expenses" : "Income";
  return `${noun} by ${groupByLabel(groupBy)}`;
}
