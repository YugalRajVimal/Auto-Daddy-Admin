export function slugifyLabel(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Converts expense category rows from the backend
 * (GET /admin/accounts/expenses-category) into the local CategoryOption
 * shape the ledger UI already works with. Uses the Mongo _id as the
 * option `value` so category CRUD calls can reference it directly;
 * subcategories don't carry a stable id from the API, so their name is
 * used as both value and label.
 */