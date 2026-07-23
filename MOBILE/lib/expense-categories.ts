export type CategoryOption = {
  value: string;
  label: string;
  subcategories: { value: string; label: string }[];
};

/** Same defaults as web `src/pages/AdminPages/Accounts/ledgerCategories.ts`. */
export const EXPENSE_CATEGORIES: CategoryOption[] = [
  {
    value: "advertising",
    label: "Advertising",
    subcategories: [
      { value: "print", label: "Print Advertising" },
      { value: "online", label: "Online Advertising" },
      { value: "social-media", label: "Social Media" },
    ],
  },
  {
    value: "bank",
    label: "Bank",
    subcategories: [
      { value: "bank-charges", label: "Bank Charges" },
      { value: "guarantee-fees", label: "Guarantee Fees" },
      { value: "loan-interest", label: "Loan Interest" },
    ],
  },
  {
    value: "car-vehicle",
    label: "Car & Vehicle",
    subcategories: [
      { value: "detailing", label: "DETAILING" },
      { value: "fuel", label: "Fuel" },
      { value: "insurance", label: "Insurance" },
      { value: "maintenance", label: "Maintenance" },
    ],
  },
  {
    value: "domestic",
    label: "Domestic",
    subcategories: [
      { value: "groceries", label: "Groceries" },
      { value: "household", label: "Household Items" },
    ],
  },
  {
    value: "entertainment",
    label: "Entertainment",
    subcategories: [
      { value: "events", label: "Events" },
      { value: "subscriptions", label: "Subscriptions" },
    ],
  },
  {
    value: "furniture-fixtures",
    label: "Furniture & Fixtures",
    subcategories: [
      { value: "furniture", label: "Furniture" },
      { value: "fixtures", label: "Fixtures" },
    ],
  },
  {
    value: "loans-advances",
    label: "Loans and Advances",
    subcategories: [
      { value: "loan-repayment", label: "Loan Repayment" },
      { value: "advances", label: "Advances" },
    ],
  },
  {
    value: "other-expenses",
    label: "Other Expenses",
    subcategories: [{ value: "misc", label: "Misc. Exp." }],
  },
  {
    value: "personal",
    label: "Personal",
    subcategories: [
      { value: "personal-exp", label: "Personal Expense" },
      { value: "drawings", label: "Drawings" },
    ],
  },
  {
    value: "professional",
    label: "Professional",
    subcategories: [
      { value: "software-charges", label: "Software Charges" },
      { value: "legal", label: "Legal Fees" },
      { value: "accounting", label: "Accounting Fees" },
    ],
  },
  {
    value: "rent-lease",
    label: "Rent & Lease",
    subcategories: [
      { value: "office-rent", label: "Office Rent" },
      { value: "equipment-lease", label: "Equipment Lease" },
    ],
  },
  {
    value: "staff-contractors",
    label: "Staff & Contractors",
    subcategories: [
      { value: "salaries", label: "Salaries" },
      { value: "wages", label: "Wages" },
      { value: "contractors", label: "Contractors" },
    ],
  },
  {
    value: "supplies",
    label: "Supplies",
    subcategories: [
      { value: "office-supplies", label: "Office Supplies" },
      { value: "shop-supplies", label: "Shop Supplies" },
    ],
  },
  {
    value: "taxation",
    label: "Taxation",
    subcategories: [
      { value: "gst-hst", label: "GST / HST" },
      { value: "payroll-tax", label: "Payroll Tax" },
    ],
  },
  {
    value: "training-education",
    label: "Training & Education",
    subcategories: [
      { value: "courses", label: "Courses" },
      { value: "certifications", label: "Certifications" },
    ],
  },
  {
    value: "utilities",
    label: "Utilities",
    subcategories: [
      { value: "electricity", label: "Electricity" },
      { value: "internet", label: "Internet" },
      { value: "phone", label: "Phone" },
      { value: "water", label: "Water" },
    ],
  },
];

export function cloneCategories(categories: CategoryOption[]): CategoryOption[] {
  return categories.map((cat) => ({
    ...cat,
    subcategories: [...cat.subcategories],
  }));
}

export function categoryLabel(categories: CategoryOption[], category: string, subcategory: string) {
  const cat = categories.find((c) => c.value === category);
  const sub = cat?.subcategories.find((s) => s.value === subcategory);
  return {
    category: cat?.label ?? category,
    subcategory: sub?.label ?? subcategory,
  };
}

export function slugifyLabel(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function dedupeLabels(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

export function resolveCategoryValue(categories: CategoryOption[], raw: unknown): string {
  const input = String(raw ?? "").trim();
  if (!input) return "";
  const direct = categories.find((c) => c.value === input);
  if (direct) return direct.value;
  const byLabel = categories.find((c) => c.label.toLowerCase() === input.toLowerCase());
  if (byLabel) return byLabel.value;
  const slug = slugifyLabel(input);
  const bySlug = categories.find((c) => c.value === slug);
  return bySlug ? bySlug.value : slug;
}

export function resolveSubcategoryValue(category: CategoryOption | undefined, raw: unknown): string {
  const input = String(raw ?? "").trim();
  if (!input) return "";
  const subs = category?.subcategories ?? [];
  const direct = subs.find((s) => s.value === input);
  if (direct) return direct.value;
  const byLabel = subs.find((s) => s.label.toLowerCase() === input.toLowerCase());
  if (byLabel) return byLabel.value;
  const slug = slugifyLabel(input);
  const bySlug = subs.find((s) => s.value === slug);
  return bySlug ? bySlug.value : slug;
}
